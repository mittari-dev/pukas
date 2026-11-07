// Operações do painel, sempre com o cliente da sessão: o banco (RLS + gatilhos) decide o que pode.
import type { SupabaseClient } from '@supabase/supabase-js';
import { invalidateByTag } from '@vercel/functions';
import { ETIQUETA_INDICE, etiquetaPeca } from '../cache';
import { paraLinha } from '../painel/formulario';
import { traduzirErroBanco } from '../painel/erros';
import type { EstadoPeca, PecaEntrada, TipoPeca } from '../painel/travas';
import type { LinhaPeca } from './pecas';

export type Resultado<T = void> = { ok: true; valor: T } | { ok: false; erro: string };

const TIPOS_FOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
// O Vercel recusa requisição acima de 4,5 MB antes de chegar aqui; a foto vai junto com o texto do formulário.
export const FOTO_MAX_BYTES = 4 * 1024 * 1024;

export interface LinhaFila {
  id: string;
  tipo: TipoPeca;
  titulo: string;
  estado: EstadoPeca;
  numero: number | null;
  slug: string | null;
  atualizado_em: string;
}

export async function listarFila(cliente: SupabaseClient, estado: EstadoPeca, tipo?: TipoPeca): Promise<LinhaFila[]> {
  let q = cliente.from('pecas').select('id, tipo, titulo, estado, numero, slug, atualizado_em').eq('estado', estado).order('atualizado_em', { ascending: false }).limit(200);
  if (tipo) q = q.eq('tipo', tipo);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as LinhaFila[];
}

export async function buscarPeca(cliente: SupabaseClient, id: string): Promise<(LinhaPeca & { atualizado_em: string }) | null> {
  const { data, error } = await cliente.from('pecas').select('*, correcoes(data, texto), traducoes(*)').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Renova o cache das páginas da peça e das listas. Falha aqui não desfaz a gravação: o painel avisa.
export async function renovarPaginas(id: string): Promise<boolean> {
  try {
    await invalidateByTag([etiquetaPeca(id), ETIQUETA_INDICE]);
    return true;
  } catch {
    return false;
  }
}

export async function salvar(cliente: SupabaseClient, p: PecaEntrada, usuario: string, id?: string): Promise<Resultado<string>> {
  const linha = { ...paraLinha(p), atualizado_por: usuario };
  const { data, error } = id
    ? await cliente.from('pecas').update(linha).eq('id', id).select('id').maybeSingle()
    : await cliente.from('pecas').insert({ ...linha, criado_por: usuario }).select('id').single();
  if (error) return { ok: false, erro: traduzirErroBanco(error) };
  // Update que a RLS barrou não dá erro: só não volta linha.
  if (!data) return { ok: false, erro: 'Você não tem permissão para mudar esta peça.' };
  return { ok: true, valor: data.id };
}

export async function corrigir(cliente: SupabaseClient, id: string, texto: string): Promise<Resultado> {
  const { error } = await cliente.from('correcoes').insert({ peca_id: id, texto });
  return error ? { ok: false, erro: traduzirErroBanco(error) } : { ok: true, valor: undefined };
}

export async function enviarFoto(cliente: SupabaseClient, arquivo: File): Promise<Resultado<string>> {
  const extensao = TIPOS_FOTO[arquivo.type];
  if (!extensao) return { ok: false, erro: 'A foto precisa ser JPG, PNG ou WebP.' };
  if (arquivo.size > FOTO_MAX_BYTES) return { ok: false, erro: 'A foto passa de 4 MB. Diminua e envie de novo.' };
  const caminho = `${crypto.randomUUID()}.${extensao}`;
  const { error } = await cliente.storage.from('fotos').upload(caminho, arquivo, { contentType: arquivo.type });
  return error ? { ok: false, erro: 'Não deu para enviar a foto. Tente de novo.' } : { ok: true, valor: caminho };
}
