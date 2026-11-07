// Única porta de entrada das páginas e do RSS para o conteúdo, agora lido do Supabase.
// O banco já recusa peça fora das regras (gatilho pecas_travas) e só mostra o publicado (RLS).
// Em espanhol, devolve só o que tem tradução pronta, já mesclado.
import type { Edicao } from './edicoes';
import type { Obra } from './cultura';
import type { MarcaTraducao } from './traducao';
import type { Idioma } from './idioma';
import { clientePublico, urlBanco } from './banco/cliente';
import { emEspanhol, paraEdicao, paraObra, type ComCorpo, type LinhaPeca } from './banco/pecas';
import type { TipoPeca } from './painel/travas';
import { serieNoIdioma, type LinhaSerie, type Serie } from './series';
import type { Fonte } from './edicoes';
import type { Casa, Proposicao } from './votacoes/congresso';

export type EdicaoIdioma = Edicao & MarcaTraducao & { body?: string; pecaId?: string };
export type ObraIdioma = Obra & MarcaTraducao & { body?: string };
export interface Pagina {
  id: string;
  titulo: string;
  resumo: string;
  body: string;
}

async function publicadas(tipo: TipoPeca): Promise<LinhaPeca[]> {
  const { data, error } = await clientePublico()
    .from('pecas')
    .select('*, correcoes(data, texto), traducoes(*)')
    .eq('tipo', tipo)
    .eq('estado', 'publicada')
    .order('numero', { ascending: false, nullsFirst: false })
    .order('publicada_em', { ascending: false });
  if (error) throw new Error(`banco: ${error.message}`);
  return data as LinhaPeca[];
}

function noIdioma<T extends { data: { titulo: string; resumo: string } }>(linhas: LinhaPeca[], idioma: Idioma, mapear: (l: LinhaPeca) => ComCorpo<T>): ComCorpo<T>[] {
  const pecas = linhas.map((l) => [l, mapear(l)] as const);
  if (idioma === 'pt') return pecas.map(([, p]) => p);
  return pecas.map(([l, p]) => emEspanhol(p, l)).filter((p): p is ComCorpo<T> => p !== null);
}

// Com série: só as edições dela (o arquivo e o "anterior/seguinte" de uma edição ficam dentro da série).
export async function carregarEdicoes(idioma: Idioma = 'pt', serie?: string): Promise<EdicaoIdioma[]> {
  const base = urlBanco();
  const linhas = (await publicadas('newsletter')).filter((l) => !serie || l.serie === serie);
  return noIdioma(linhas, idioma, (l) => paraEdicao(l, base));
}

// Séries ligadas, no idioma da página (a RLS só mostra as ligadas a quem não é da equipe).
export async function carregarSeries(idioma: Idioma = 'pt'): Promise<Serie[]> {
  const { data, error } = await clientePublico().from('series').select('*').eq('ativa', true).order('criada_em');
  if (error) throw new Error(`banco: ${error.message}`);
  return (data as LinhaSerie[]).map((l) => serieNoIdioma(l, idioma));
}

export async function carregarObras(idioma: Idioma = 'pt'): Promise<ObraIdioma[]> {
  const base = urlBanco();
  return noIdioma(await publicadas('cultura'), idioma, (l) => paraObra(l, base));
}

// Notícia usa a forma da edição (fontes, checagem, foto, correções); o id é o slug do endereço.
export async function carregarNoticias(idioma: Idioma = 'pt'): Promise<EdicaoIdioma[]> {
  const base = urlBanco();
  return noIdioma(await publicadas('noticia'), idioma, (l) => ({ ...paraEdicao(l, base), id: l.slug ?? l.id }));
}

export async function carregarPagina(slug: string, idioma: Idioma = 'pt'): Promise<Pagina | null> {
  const { data, error } = await clientePublico().from('pecas').select('*, traducoes(*)').eq('tipo', 'pagina').eq('slug', slug).eq('estado', 'publicada').maybeSingle();
  if (error) throw new Error(`banco: ${error.message}`);
  if (!data) return null;
  const l = data as LinhaPeca;
  if (idioma === 'pt') return { id: l.id, titulo: l.titulo, resumo: l.resumo, body: l.corpo };
  const t = l.traducoes?.find((x) => x.estado === 'pronta');
  return t ? { id: l.id, titulo: t.titulo ?? l.titulo, resumo: t.resumo ?? l.resumo, body: t.corpo ?? '' } : null;
}

// /es/<peça sem tradução>: mostra o original com o aviso "Traducción en camino" (ruling 6 do plano).
export function pendente<T extends MarcaTraducao>(peca: T): T {
  return { ...peca, traducao: { revisado: false, pendente: true } };
}

// Votações (spec consultas §2 e §3). Em espanhol, título e explicação traduzidos quando prontos; sem tradução, o original
// (a votação vale para os dois idiomas e tem prazo: não espera a tradução).
export interface VotacaoPublica {
  id: string;
  pecaId: string;
  titulo: string;
  resumo: string;
  proposicao: Proposicao;
  publicadaEm: Date;
  fechaEm: Date | null;
  fechada: boolean;
  altoImpacto: boolean;
  fontes: Fonte[];
}

function paraVotacao(l: LinhaPeca, idioma: Idioma, agora: Date): VotacaoPublica {
  const tr = idioma === 'es' ? l.traducoes?.find((x) => x.estado === 'pronta') : undefined;
  const fechaEm = l.fecha_em ? new Date(l.fecha_em) : null;
  return {
    id: l.slug ?? l.id,
    pecaId: l.id,
    titulo: tr?.titulo ?? l.titulo,
    resumo: tr?.resumo ?? l.resumo,
    proposicao: l.proposicao!,
    publicadaEm: new Date(l.publicada_em ?? Date.now()),
    fechaEm,
    fechada: fechaEm !== null && agora > fechaEm,
    altoImpacto: Boolean(l.alto_impacto),
    fontes: paraEdicao(l, '').data.fontes,
  };
}

export async function carregarVotacoes(idioma: Idioma = 'pt', agora = new Date()): Promise<{ abertas: VotacaoPublica[]; encerradas: VotacaoPublica[] }> {
  const todas = (await publicadas('votacao')).map((l) => paraVotacao(l, idioma, agora));
  return { abertas: todas.filter((v) => !v.fechada), encerradas: todas.filter((v) => v.fechada) };
}

export async function carregarVotacao(slug: string, idioma: Idioma = 'pt', agora = new Date()): Promise<VotacaoPublica | null> {
  const { data, error } = await clientePublico().from('pecas').select('*, traducoes(*)').eq('tipo', 'votacao').eq('estado', 'publicada').eq('slug', slug).maybeSingle();
  if (error) throw new Error(`banco: ${error.message}`);
  return data ? paraVotacao(data as LinhaPeca, idioma, agora) : null;
}

// Ligação votação ↔ notícias: a RLS só mostra quando as duas estão no ar.
export async function noticiasDaVotacao(votacaoId: string): Promise<{ slug: string; titulo: string }[]> {
  const db = clientePublico();
  const { data: ligacoes, error } = await db.from('votacao_noticias').select('noticia_id').eq('votacao_id', votacaoId);
  if (error) throw new Error(`banco: ${error.message}`);
  if (!ligacoes?.length) return [];
  const { data, error: e } = await db.from('pecas').select('slug, titulo').in('id', ligacoes.map((x) => x.noticia_id)).eq('estado', 'publicada');
  if (e) throw new Error(`banco: ${e.message}`);
  return (data ?? []) as { slug: string; titulo: string }[];
}

export async function votacaoDaNoticia(noticiaId: string, idioma: Idioma = 'pt', agora = new Date()): Promise<VotacaoPublica | null> {
  const db = clientePublico();
  const { data: ligacoes, error } = await db.from('votacao_noticias').select('votacao_id').eq('noticia_id', noticiaId);
  if (error) throw new Error(`banco: ${error.message}`);
  if (!ligacoes?.length) return null;
  const { data, error: e } = await db
    .from('pecas')
    .select('*, traducoes(*)')
    .in('id', ligacoes.map((x) => x.votacao_id))
    .eq('estado', 'publicada')
    .order('publicada_em', { ascending: false });
  if (e) throw new Error(`banco: ${e.message}`);
  const vs = ((data ?? []) as LinhaPeca[]).map((l) => paraVotacao(l, idioma, agora));
  return vs.find((v) => !v.fechada) ?? vs[0] ?? null;
}

export interface Plenario {
  idOficial: string;
  casa: Casa;
  data: Date;
  descricao: string;
  sim: number;
  nao: number;
  abstencao: number;
  outros: number;
  votos: { nome: string; partido: string; uf: string; voto: string }[];
}

export async function plenarioDaVotacao(votacaoId: string): Promise<Plenario[]> {
  const { data, error } = await clientePublico().from('plenario_votacoes').select('*, plenario_votos(*)').eq('votacao_id', votacaoId).order('data', { ascending: false });
  if (error) throw new Error(`banco: ${error.message}`);
  return (data ?? []).map((p) => ({
    idOficial: p.id_oficial,
    casa: p.casa,
    data: new Date(p.data),
    descricao: p.descricao,
    sim: p.sim,
    nao: p.nao,
    abstencao: p.abstencao,
    outros: p.outros,
    votos: [...(p.plenario_votos ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  }));
}
