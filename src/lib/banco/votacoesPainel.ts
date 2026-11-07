// Votação no painel: notícias ligadas, resultado, relatos e plenário. Usa o cliente logado (RLS + 2FA), nunca a chave mestra:
// relatos só aparecem para editor e revisor, e apagar relato só o editor consegue (função apagar_relato no banco).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Opcao } from '../votacoes/voto';
import type { VotacaoNominal } from '../votacoes/congresso';

export interface Relato {
  opcao: Opcao;
  relato: string;
  citar: boolean;
  comprovante: string;
}

export async function noticiasParaLigar(db: SupabaseClient): Promise<{ id: string; titulo: string }[]> {
  const { data, error } = await db.from('pecas').select('id, titulo').eq('tipo', 'noticia').eq('estado', 'publicada').order('publicada_em', { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function noticiasLigadas(db: SupabaseClient, votacaoId: string): Promise<string[]> {
  const { data, error } = await db.from('votacao_noticias').select('noticia_id').eq('votacao_id', votacaoId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((x) => x.noticia_id);
}

// Troca as ligações pelas marcadas no formulário.
export async function ligarNoticias(db: SupabaseClient, votacaoId: string, noticias: string[]): Promise<boolean> {
  const { error } = await db.from('votacao_noticias').delete().eq('votacao_id', votacaoId);
  if (error) return false;
  if (!noticias.length) return true;
  const { error: e } = await db.from('votacao_noticias').insert(noticias.map((noticia_id) => ({ votacao_id: votacaoId, noticia_id })));
  return !e;
}

export async function resultadoNoPainel(db: SupabaseClient, votacaoId: string) {
  const { data, error } = await db.rpc('resultado_votacao', { v: votacaoId });
  if (error) throw new Error(error.message);
  return ((data ?? [])[0] ?? { a_favor: 0, contra: 0, nao_sei: 0, descartes: {} }) as { a_favor: number; contra: number; nao_sei: number; descartes: Record<string, number> };
}

// Só relatos de votos válidos: descartado não entra na pauta. A RLS devolve vazio para o redator.
export async function relatos(db: SupabaseClient, votacaoId: string, soCitaveis: boolean): Promise<Relato[]> {
  let q = db.from('votos').select('opcao, relato, citar, comprovante').eq('votacao_id', votacaoId).eq('descartado', false).not('relato', 'is', null).order('criado_em');
  if (soCitaveis) q = q.eq('citar', true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Relato[];
}

export async function apagarRelato(db: SupabaseClient, comprovante: string): Promise<boolean> {
  const { data, error } = await db.rpc('apagar_relato', { c: comprovante.replace(/^#/, '').trim().toUpperCase() });
  return !error && data === true;
}

export async function plenarioMaisRecente(db: SupabaseClient, votacaoId: string): Promise<VotacaoNominal | undefined> {
  const { data, error } = await db.from('plenario_votacoes').select('*').eq('votacao_id', votacaoId).order('data', { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  const p = data?.[0];
  return p ? { idOficial: p.id_oficial, data: new Date(p.data), descricao: p.descricao, sim: p.sim, nao: p.nao, abstencao: p.abstencao, outros: p.outros, votos: [] } : undefined;
}
