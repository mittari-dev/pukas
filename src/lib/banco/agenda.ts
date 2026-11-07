// Agenda e ritmo no banco, com o cliente da sessão do painel: a RLS decide quem pode (spec agenda §5).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dia, SituacaoManual } from '../agenda';
import type { EstadoPeca, TipoPeca } from '../painel/travas';
import { traduzirErroBanco } from '../painel/erros';
import type { Resultado } from './painel';

export interface ItemAgenda {
  id: string;
  dia: Dia;
  tipo: Exclude<TipoPeca, 'pagina'>;
  serie: string | null;
  titulo: string;
  nota: string | null;
  situacao: SituacaoManual;
  peca_id: string | null;
  responsavel: string | null;
  criado_por: string | null;
  peca?: { estado: EstadoPeca; titulo: string } | null;
}

export interface Compromisso {
  id: string;
  dia_semana: number;
  tipo: Exclude<TipoPeca, 'pagina'>;
  serie: string | null;
  rotulo: string | null;
  ativo: boolean;
}

type Gravacao = Pick<ItemAgenda, 'dia' | 'tipo' | 'titulo'> & Partial<Pick<ItemAgenda, 'serie' | 'nota' | 'situacao' | 'responsavel' | 'peca_id'>>;

const falha = (error: { code?: string; message: string; details?: string }) => ({ ok: false as const, erro: traduzirErroBanco(error) });

export async function listarAgenda(cliente: SupabaseClient, de: Dia, ate: Dia): Promise<ItemAgenda[]> {
  const { data, error } = await cliente.from('agenda').select('*, peca:pecas(estado, titulo)').gte('dia', de).lte('dia', ate).order('dia').order('criado_em');
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemAgenda[];
}

export async function salvarItem(cliente: SupabaseClient, item: Gravacao, id?: string): Promise<Resultado<string>> {
  const linha = { nota: null, responsavel: null, ...item, serie: item.tipo === 'newsletter' ? (item.serie ?? null) : null };
  const { data, error } = id
    ? await cliente.from('agenda').update(linha).eq('id', id).select('id').single()
    : await cliente.from('agenda').insert(linha).select('id').single();
  return error ? falha(error) : { ok: true, valor: data.id };
}

export async function apagarItem(cliente: SupabaseClient, id: string): Promise<Resultado> {
  const { data, error } = await cliente.from('agenda').delete().eq('id', id).select('id');
  if (error) return falha(error);
  // RLS que recusa um delete não dá erro: só não apaga nada.
  return data.length ? { ok: true, valor: undefined } : { ok: false, erro: 'Você só pode apagar os itens que criou.' };
}

export async function ligarPeca(cliente: SupabaseClient, itemId: string, pecaId: string | null): Promise<Resultado> {
  const { error } = await cliente.from('agenda').update({ peca_id: pecaId }).eq('id', itemId);
  return error ? falha(error) : { ok: true, valor: undefined };
}

// Peças que ainda estão sendo feitas e não estão em nenhum item: as que dá para ligar.
export async function pecasSemItem(cliente: SupabaseClient): Promise<{ id: string; tipo: TipoPeca; titulo: string }[]> {
  const [{ data: pecas, error }, { data: ligadas }] = await Promise.all([
    cliente.from('pecas').select('id, tipo, titulo').in('estado', ['rascunho', 'em_revisao']).neq('tipo', 'pagina').order('atualizado_em', { ascending: false }).limit(100),
    cliente.from('agenda').select('peca_id').not('peca_id', 'is', null),
  ]);
  if (error) throw new Error(error.message);
  const usadas = new Set((ligadas ?? []).map((l) => l.peca_id));
  return (pecas ?? []).filter((p) => !usadas.has(p.id));
}

export async function listarRitmo(cliente: SupabaseClient): Promise<Compromisso[]> {
  const { data, error } = await cliente.from('ritmo').select('id, dia_semana, tipo, serie, rotulo, ativo').order('dia_semana').order('criado_em');
  if (error) throw new Error(error.message);
  return (data ?? []) as Compromisso[];
}

export async function salvarRitmo(cliente: SupabaseClient, linha: Omit<Compromisso, 'id'>, id?: string): Promise<Resultado> {
  const valor = { ...linha, serie: linha.tipo === 'newsletter' ? linha.serie : null };
  const { data, error } = id ? await cliente.from('ritmo').update(valor).eq('id', id).select('id') : await cliente.from('ritmo').insert(valor).select('id');
  if (error) return falha(error);
  return data.length ? { ok: true, valor: undefined } : { ok: false, erro: 'Só quem é editor muda o ritmo.' };
}

export async function apagarRitmo(cliente: SupabaseClient, id: string): Promise<Resultado> {
  const { data, error } = await cliente.from('ritmo').delete().eq('id', id).select('id');
  if (error) return falha(error);
  return data.length ? { ok: true, valor: undefined } : { ok: false, erro: 'Só quem é editor muda o ritmo.' };
}

// Para o campo "responsável": a equipe toda (a RLS só mostra colegas a quem tem 2FA).
export async function listarPessoas(cliente: SupabaseClient): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await cliente.from('perfis').select('id, nome').order('nome');
  if (error) throw new Error(error.message);
  return data ?? [];
}
