// Votos do público. Grava e lê com a chave mestra, porque nenhuma política deixa o público tocar em `votos`.
// Só a rota /api/votar e as páginas de votação chamam; o público só vê o que as funções públicas do banco devolvem.
import { mestre } from './equipe';
import type { Opcao } from '../votacoes/voto';
import { contasDeVotoParaApagar } from '../votacoes/conta';
import type { Proposicao } from '../votacoes/congresso';

export interface VotacaoPublicada {
  id: string;
  slug: string;
  fecha_em: string | null;
  alto_impacto: boolean;
  proposicao: Proposicao;
}

export interface LinhaVoto {
  votacao_id: string;
  opcao: Opcao;
  relato: string | null;
  citar: boolean;
  comprovante: string;
  aparelho_hash: string;
  ip_hash: string;
  conta_hash?: string | null;
  descartado: boolean;
  motivo: string | null;
}

export interface Resultado {
  a_favor: number;
  contra: number;
  nao_sei: number;
  descartes: Record<string, number>;
}

export const estaFechada = (v: Pick<VotacaoPublicada, 'fecha_em'>, agora = new Date()) => v.fecha_em !== null && agora > new Date(v.fecha_em);

// A votação publicada com esse endereço, aberta ou já fechada; null se não existe ou saiu do ar.
export async function votacaoAberta(slug: string): Promise<VotacaoPublicada | null> {
  const { data, error } = await mestre()
    .from('pecas')
    .select('id, slug, fecha_em, alto_impacto, proposicao')
    .eq('tipo', 'votacao')
    .eq('estado', 'publicada')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as VotacaoPublicada | null;
}

export async function votoDoAparelho(votacaoId: string, aparelhoHash: string): Promise<{ comprovante: string } | null> {
  const { data, error } = await mestre().from('votos').select('comprovante').eq('votacao_id', votacaoId).eq('aparelho_hash', aparelhoHash).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function votoDaConta(votacaoId: string, contaHash: string): Promise<{ comprovante: string } | null> {
  const { data, error } = await mestre().from('votos').select('comprovante').eq('votacao_id', votacaoId).eq('conta_hash', contaHash).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Alto impacto: a conta Google temporária sai do Supabase depois do voto; no banco fica só o hash dela.
// Nunca apaga conta da equipe: quem tem perfil no painel fica, mesmo que tenha chegado aqui pelo login Google.
export async function ehDaEquipe(uid: string): Promise<boolean> {
  const { data, error } = await mestre().from('perfis').select('id').eq('id', uid).maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function apagarConta(uid: string): Promise<void> {
  if (await ehDaEquipe(uid)) return;
  const { error } = await mestre().auth.admin.deleteUser(uid);
  if (error) console.error('apagar conta do voto:', error.message);
}

// Faxina diária das contas de voto abandonadas (src/lib/votacoes/conta.ts decide quais).
export async function limparContasDeVoto(): Promise<number> {
  const db = mestre();
  const [{ data: contas, error }, { data: perfis }] = await Promise.all([db.auth.admin.listUsers({ perPage: 1000 }), db.from('perfis').select('id')]);
  if (error) throw new Error(error.message);
  const ids = contasDeVotoParaApagar(contas.users, new Set((perfis ?? []).map((p) => p.id)));
  for (const id of ids) await apagarConta(id);
  return ids.length;
}

// Votos válidos da mesma rede: na última hora (desde = true) ou na votação inteira.
export async function validosDaRede(votacaoId: string, ipHash: string, naHora: boolean): Promise<number> {
  let q = mestre().from('votos').select('id', { count: 'exact', head: true }).eq('votacao_id', votacaoId).eq('ip_hash', ipHash).eq('descartado', false);
  if (naHora) q = q.gte('criado_em', new Date(Date.now() - 60 * 60_000).toISOString());
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type Gravado = { comprovante: string; ja: boolean } | { fechada: true };

// Dois cliques ao mesmo tempo: o índice único do aparelho (ou da conta) segura o segundo, que recebe o comprovante do primeiro.
export async function gravarVoto(linha: LinhaVoto, novoComprovante: () => string): Promise<Gravado> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { error } = await mestre().from('votos').insert(linha);
    if (!error) return { comprovante: linha.comprovante, ja: false };
    if (error.code === 'P0001') return { fechada: true };
    if (error.code !== '23505') throw new Error(error.message);
    const existente = (await votoDoAparelho(linha.votacao_id, linha.aparelho_hash)) ?? (linha.conta_hash ? await votoDaConta(linha.votacao_id, linha.conta_hash) : null);
    if (existente) return { comprovante: existente.comprovante, ja: true };
    // Comprovante sorteado repetido (raro): sorteia outro.
    linha = { ...linha, comprovante: novoComprovante() };
  }
  throw new Error('não deu para sortear um comprovante livre');
}

export async function resultado(votacaoId: string): Promise<Resultado | null> {
  const { data, error } = await mestre().rpc('resultado_votacao', { v: votacaoId });
  if (error) throw new Error(error.message);
  return (data as Resultado[])[0] ?? null;
}

export async function comprovantes(votacaoId: string): Promise<{ comprovante: string; opcao: Opcao; dia: string }[]> {
  const { data, error } = await mestre().rpc('comprovantes_votacao', { v: votacaoId });
  if (error) throw new Error(error.message);
  return data ?? [];
}
