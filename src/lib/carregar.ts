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

export type EdicaoIdioma = Edicao & MarcaTraducao & { body?: string };
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
