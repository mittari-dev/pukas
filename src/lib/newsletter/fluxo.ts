// O fluxo da newsletter por e-mail: assinar, confirmar, boas-vindas, edição e sair. Tudo com a chave de serviço:
// nenhuma política deixa público ou equipe ler os e-mails (supabase/migrations/20261108000007_assinantes.sql).
import { mestre } from '../banco/equipe';
import { renderizarMarkdown } from '../markdown';
import { caminhoEdicao, formatarData } from '../formato';
import { urlBanco } from '../banco/cliente';
import { urlFoto } from '../banco/pecas';
import { prefixar, type Idioma } from '../idioma';
import { emailConfirmacao, emailEdicao, montarBoasVindas, proximoEm, type Email } from './emails';
import { enviarLote, type Mensagem } from './resend';

interface Assinante {
  id: string;
  email: string;
  idioma: Idioma;
  token: string;
  confirmado_em: string | null;
  boas_vindas: number;
}

const ambiente = (nome: string) => process.env[nome] ?? (import.meta.env?.[nome] as string | undefined);
const linkSair = (site: string, token: string) => `${site}/api/sair?t=${token}`;

async function mandar(mensagens: Mensagem[]) {
  const chave = ambiente('RESEND_API_KEY');
  if (!chave) throw new Error('RESEND_API_KEY não definida');
  return enviarLote(chave, mensagens, { responderPara: ambiente('CONTATO_EMAIL') });
}
const mensagem = (para: string, e: Email, sair: string | null): Mensagem => ({ para, assunto: e.assunto, html: e.html, text: e.text, sair });

export type Pedido = 'enviado' | 'ja_assinante' | 'espera';

// Pedido repetido não manda e-mail sem limite: ninguém usa o formulário para lotar a caixa de alguém.
// email já vem limpo e em minúsculas (emailValido).
export async function pedirAssinatura(email: string, idioma: Idioma, site: string, series: string[] = []): Promise<Pedido> {
  const db = mestre();
  const { data: existente, error } = await db.from('assinantes').select('token, confirmado_em, envios, ultimo_envio, series').eq('email', email).maybeSingle();
  if (error) throw new Error(error.message);
  if (existente?.confirmado_em) {
    // Já assina e marcou outra série: soma (quem já recebe todas continua com todas). Sem e-mail, sem revelar nada.
    const atuais = existente.series as string[];
    if (atuais.length > 0 && series.length > 0) await db.from('assinantes').update({ series: [...new Set([...atuais, ...series])] }).eq('token', existente.token);
    if (atuais.length > 0 && series.length === 0) await db.from('assinantes').update({ series: [] }).eq('token', existente.token);
    return 'ja_assinante';
  }
  let token = existente?.token as string | undefined;
  if (existente) {
    // No máximo 3 e-mails de confirmação por endereço, com 10 minutos entre eles; o pedido some em 7 dias de qualquer jeito.
    if (existente.envios >= 3 || Date.now() - new Date(existente.ultimo_envio).getTime() < 10 * 60_000) return 'espera';
    await db.from('assinantes').update({ envios: existente.envios + 1, ultimo_envio: new Date().toISOString(), idioma, series }).eq('token', token!);
  } else {
    const r = await db.from('assinantes').insert({ email, idioma, series }).select('token').single();
    if (r.error) {
      // Dois envios do mesmo formulário ao mesmo tempo: o primeiro já mandou.
      if (r.error.code === '23505') return 'espera';
      throw new Error(r.error.message);
    }
    token = r.data.token;
  }
  const { enviados } = await mandar([mensagem(email, emailConfirmacao(idioma, `${site}/api/confirmar?t=${token}`), null)]);
  if (!enviados) throw new Error('confirmação não saiu');
  return 'enviado';
}

// Confirma e manda o 1º e-mail de boas-vindas. Devolve o idioma, para a página de volta.
export async function confirmar(token: string, site: string): Promise<Idioma | null> {
  const db = mestre();
  const agora = new Date();
  const { data, error } = await db
    .from('assinantes')
    .update({ confirmado_em: agora.toISOString() })
    .eq('token', token)
    .is('confirmado_em', null)
    .select('id, email, idioma, token, confirmado_em, boas_vindas')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    // Link clicado de novo: já confirmado, só volta.
    const { data: ja } = await db.from('assinantes').select('idioma').eq('token', token).maybeSingle();
    return (ja?.idioma as Idioma | undefined) ?? null;
  }
  await db.from('assinantes_eventos').insert({ tipo: 'entrou' });
  await mandarBoasVindas([data as Assinante], site);
  return data.idioma as Idioma;
}

async function mandarBoasVindas(lista: Assinante[], site: string): Promise<number> {
  let feitos = 0;
  for (const a of lista) {
    const { enviados } = await mandar([mensagem(a.email, montarBoasVindas(a.idioma, a.boas_vindas, site, linkSair(site, a.token)), linkSair(site, a.token))]);
    if (!enviados) continue;
    const passos = a.boas_vindas + 1;
    const proximo = proximoEm(passos, new Date(a.confirmado_em!));
    await mestre().from('assinantes').update({ boas_vindas: passos, proximo_em: proximo?.toISOString() ?? null }).eq('id', a.id);
    feitos++;
  }
  return feitos;
}

// Robô diário: manda as boas-vindas que venceram e apaga pedidos nunca confirmados (7 dias).
export async function rodarRobo(site: string): Promise<{ boasVindas: number; pendentesApagados: number }> {
  const db = mestre();
  const { data, error } = await db
    .from('assinantes')
    .select('id, email, idioma, token, confirmado_em, boas_vindas')
    .lte('proximo_em', new Date().toISOString())
    .not('confirmado_em', 'is', null)
    .limit(300);
  if (error) throw new Error(error.message);
  const boasVindas = await mandarBoasVindas((data ?? []) as Assinante[], site);
  const semana = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: apagados } = await db.from('assinantes').delete().is('confirmado_em', null).lt('criado_em', semana).select('id');
  return { boasVindas, pendentesApagados: apagados?.length ?? 0 };
}

export async function idiomaDoToken(token: string): Promise<Idioma | null> {
  const { data } = await mestre().from('assinantes').select('idioma').eq('token', token).maybeSingle();
  return (data?.idioma as Idioma | undefined) ?? null;
}

// Sair apaga o e-mail de vez; fica só a contagem.
export async function sair(token: string): Promise<boolean> {
  const db = mestre();
  const { data } = await db.from('assinantes').delete().eq('token', token).select('confirmado_em');
  if (!data?.length) return false;
  if (data[0].confirmado_em) await db.from('assinantes_eventos').insert({ tipo: 'saiu' });
  return true;
}

// Confirmados que recebem esta série (sem série: todos os confirmados).
export async function contarConfirmados(serie?: string | null): Promise<number> {
  let q = mestre().from('assinantes').select('id', { count: 'exact', head: true }).not('confirmado_em', 'is', null);
  if (serie) q = q.or(`series.eq.{},series.cs.{${serie}}`);
  const { count } = await q;
  return count ?? 0;
}

export type Envio = { ok: true; enviados: number; falhas: number } | { ok: false; erro: string };

// Manda uma edição publicada para todos os confirmados, uma vez só. Em espanhol vai a tradução pronta; sem ela, o original.
export async function enviarEdicao(pecaId: string, por: string, site: string): Promise<Envio> {
  const db = mestre();
  const { data: p } = await db.from('pecas').select('id, tipo, estado, titulo, resumo, corpo, serie, numero, publicada_em, foto_caminho, foto_descricao, foto_credito, traducoes(idioma, estado, titulo, resumo, corpo)').eq('id', pecaId).maybeSingle();
  if (!p || p.tipo !== 'newsletter' || p.estado !== 'publicada' || !p.serie || !p.numero) return { ok: false, erro: 'Só edição da newsletter publicada vai por e-mail.' };
  // A linha em envios_newsletter é a trava: se já existe, essa edição já saiu.
  const trava = await db.from('envios_newsletter').insert({ peca_id: pecaId, por });
  if (trava.error) return { ok: false, erro: trava.error.code === '23505' ? 'Esta edição já foi enviada por e-mail.' : trava.error.message };

  const es = (p.traducoes as { idioma: string; estado: string; titulo: string | null; resumo: string | null; corpo: string | null }[]).find((t) => t.idioma === 'es' && t.estado === 'pronta');
  const versoes: Record<Idioma, { titulo: string; resumo: string; corpo: string; idioma: Idioma }> = {
    pt: { titulo: p.titulo, resumo: p.resumo, corpo: p.corpo, idioma: 'pt' },
    es: es ? { titulo: es.titulo ?? p.titulo, resumo: es.resumo ?? p.resumo, corpo: es.corpo ?? p.corpo, idioma: 'es' } : { titulo: p.titulo, resumo: p.resumo, corpo: p.corpo, idioma: 'pt' },
  };
  const { data: serie } = await db.from('series').select('nome, nome_es').eq('slug', p.serie).maybeSingle();
  const foto = p.foto_caminho ? { url: urlFoto(urlBanco(), p.foto_caminho), descricao: p.foto_descricao ?? '', credito: p.foto_credito ?? undefined } : undefined;
  const emails = {} as Record<Idioma, (sair: string) => Email>;
  for (const i of ['pt', 'es'] as Idioma[]) {
    const v = versoes[i];
    const corpoHtml = (await renderizarMarkdown(v.corpo)).replace(/<(video|audio)[^>]*src="([^"]*)"[^>]*>.*?<\/\1>/g, '<p><a href="$2">$2</a></p>');
    const link = `${site}${caminhoEdicao(p.serie, p.numero, v.idioma)}`;
    const nomeSerie = (v.idioma === 'es' ? serie?.nome_es : serie?.nome) || serie?.nome;
    const data = p.publicada_em ? formatarData(new Date(p.publicada_em), v.idioma) : undefined;
    emails[i] = (s) => emailEdicao(v.idioma, { titulo: v.titulo.replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim(), resumo: v.resumo, corpoHtml, link, serie: nomeSerie, numero: p.numero, data, foto }, s);
  }

  // Só quem assinou esta série (lista vazia = todas).
  const { data: lista, error } = await db.from('assinantes').select('email, idioma, token').not('confirmado_em', 'is', null).or(`series.eq.{},series.cs.{${p.serie}}`);
  if (error) return { ok: false, erro: error.message };
  const r = await mandar((lista ?? []).map((a) => mensagem(a.email, emails[a.idioma as Idioma](linkSair(site, a.token)), linkSair(site, a.token))));
  await db.from('envios_newsletter').update({ enviados: r.enviados, falhas: r.falhas }).eq('peca_id', pecaId);
  return { ok: true, ...r };
}

export const paginaNewsletter = (idioma: Idioma, situacao: string) => `${prefixar('/newsletter', idioma)}?assinatura=${situacao}`;
