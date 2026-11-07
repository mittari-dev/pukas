// Séries no banco, com o cliente da sessão do painel: a RLS deixa só o editor com 2FA criar e editar.
import type { SupabaseClient } from '@supabase/supabase-js';
import { invalidateByTag } from '@vercel/functions';
import { ETIQUETA_TUDO } from '../cache';
import type { LinhaSerie } from '../series';
import { traduzirErroBanco } from '../painel/erros';
import type { Resultado } from './painel';

export async function lerSeries(cliente: SupabaseClient): Promise<LinhaSerie[]> {
  const { data, error } = await cliente.from('series').select('slug, nome, nome_es, descricao, descricao_es, selo, selo_es, ativa').order('criada_em');
  if (error) throw new Error(error.message);
  return (data ?? []) as LinhaSerie[];
}

export async function criarSerie(cliente: SupabaseClient, s: LinhaSerie): Promise<Resultado> {
  const { error } = await cliente.from('series').insert(s);
  if (error?.code === '23505') return { ok: false, erro: `Já existe uma série com o endereço "${s.slug}".` };
  return error ? { ok: false, erro: traduzirErroBanco(error) } : { ok: true, valor: undefined };
}

// O endereço não entra na edição: o banco recusa mudar o slug.
export async function editarSerie(cliente: SupabaseClient, slug: string, s: Omit<LinhaSerie, 'slug'>): Promise<Resultado> {
  const { data, error } = await cliente.from('series').update(s).eq('slug', slug).select('slug').maybeSingle();
  if (error) return { ok: false, erro: traduzirErroBanco(error) };
  return data ? { ok: true, valor: undefined } : { ok: false, erro: 'Você não tem permissão para mudar esta série.' };
}

// Nome, descrição e selo aparecem em várias páginas do site: renova tudo. Falha aqui não desfaz a gravação.
export async function renovarSite(): Promise<boolean> {
  try {
    await invalidateByTag(ETIQUETA_TUDO);
    return true;
  } catch {
    return false;
  }
}
