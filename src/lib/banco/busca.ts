// Busca no banco, com o cliente da sessão do painel (spec busca §6): a RLS decide quem pode.
import type { SupabaseClient } from '@supabase/supabase-js';
import { traduzirErroBanco } from '../painel/erros';
import type { Resultado } from './painel';

export interface Rodada {
  id: string;
  pedida_por: string | null;
  estado: 'na_fila' | 'rodando' | 'pronta' | 'erro' | 'teto';
  criada_em: string;
  buscas: number;
  tokens_entrada: number;
  tokens_saida: number;
  custo_brl: number;
  erro: string | null;
}

export interface Candidata {
  id: string;
  titulo: string;
  porque: string;
  regiao: 'brasil' | 'america-latina' | 'mundo';
  tema: string;
  fontes: { veiculo: string; titulo: string; url: string; fixa: boolean }[];
  falta_confirmar: string | null;
  estado: 'nova' | 'pedida' | 'rascunho' | 'descartada';
  motivo_descarte: string | null;
  peca_id: string | null;
}

export interface ConfigBusca {
  ativo: boolean;
  dias: number[];
  hora: number;
  busca_livre: boolean;
  temas_interessa: string[];
  temas_evita: string[];
  max_candidatas: number;
  teto_brl: number;
  cambio: number;
}

export interface FonteBusca {
  id: string;
  nome: string;
  dominio: string;
  grupo: 'brasil' | 'america-latina' | 'mundo';
  ativa: boolean;
}

const ok = { ok: true as const, valor: undefined };
const falha = (error: { code?: string; message: string; details?: string }) => ({ ok: false as const, erro: traduzirErroBanco(error) });
const ler = <T>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

export const rodadas = async (cliente: SupabaseClient, limite = 10): Promise<Rodada[]> =>
  ler(await cliente.from('busca_rodadas').select('id, pedida_por, estado, criada_em, buscas, tokens_entrada, tokens_saida, custo_brl, erro').order('criada_em', { ascending: false }).limit(limite));

export const candidatasDa = async (cliente: SupabaseClient, rodadaId: string): Promise<Candidata[]> =>
  ler(await cliente.from('busca_candidatas').select('*').eq('rodada_id', rodadaId).order('criada_em'));

export async function gastoDoMes(cliente: SupabaseClient, desde: string): Promise<number> {
  const linhas = ler(await cliente.from('busca_rodadas').select('custo_brl').gte('criada_em', desde)) as { custo_brl: number }[];
  return linhas.reduce((s, r) => s + Number(r.custo_brl), 0);
}

export async function pedirRodada(cliente: SupabaseClient, quem: string): Promise<Resultado> {
  const { error } = await cliente.from('busca_rodadas').insert({ estado: 'na_fila', pedida_por: quem });
  return error ? falha(error) : ok;
}

// Update que a RLS barra não dá erro, só não muda nada: confere se mudou.
async function mudarCandidata(cliente: SupabaseClient, id: string, campos: Record<string, unknown>): Promise<Resultado> {
  const { data, error } = await cliente.from('busca_candidatas').update(campos).eq('id', id).select('id');
  if (error) return falha(error);
  return data.length ? ok : { ok: false, erro: 'Só editor e revisor escolhem as candidatas.' };
}
export const escolher = (cliente: SupabaseClient, id: string) => mudarCandidata(cliente, id, { estado: 'pedida' });
export const descartar = (cliente: SupabaseClient, id: string, motivo: string) => mudarCandidata(cliente, id, { estado: 'descartada', motivo_descarte: motivo || null });

export const lerConfig = async (cliente: SupabaseClient): Promise<ConfigBusca> => ler(await cliente.from('busca_config').select('*').single());

export async function salvarConfig(cliente: SupabaseClient, cfg: ConfigBusca): Promise<Resultado> {
  const { data, error } = await cliente.from('busca_config').update(cfg).eq('id', true).select('id');
  if (error) return falha(error);
  return data.length ? ok : { ok: false, erro: 'Só quem é editor muda a configuração.' };
}

export const listarFontes = async (cliente: SupabaseClient): Promise<FonteBusca[]> => ler(await cliente.from('busca_fontes').select('*').order('grupo').order('nome'));

export async function alternarFonte(cliente: SupabaseClient, fonte: FonteBusca): Promise<Resultado> {
  const { data, error } = await cliente.from('busca_fontes').update({ ativa: !fonte.ativa }).eq('id', fonte.id).select('id');
  if (error) return falha(error);
  return data.length ? ok : { ok: false, erro: 'Só quem é editor muda as fontes.' };
}

export async function novaFonte(cliente: SupabaseClient, f: Omit<FonteBusca, 'id' | 'ativa'>): Promise<Resultado> {
  const { error } = await cliente.from('busca_fontes').insert(f);
  if (error?.code === '23505') return { ok: false, erro: 'Essa fonte já está na lista.' };
  return error ? falha(error) : ok;
}
