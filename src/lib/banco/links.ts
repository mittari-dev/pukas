// Link curto automático de cada peça publicada (pukas.lat/ir/<código>), com o cliente logado da equipe.
import type { SupabaseClient } from '@supabase/supabase-js';
import { sugerirCodigo, variantesCodigo } from '../links';

export async function linkCurtoDaPeca(cliente: SupabaseClient, destino: string): Promise<string | null> {
  const { data } = await cliente.from('links_curtos').select('codigo').eq('destino', destino).order('criado_em').limit(1).maybeSingle();
  return data?.codigo ?? null;
}

// Já existe um link para essa página? Usa ele. Senão cria pelo título, achando um código livre.
export async function garantirLinkCurto(cliente: SupabaseClient, destino: string, titulo: string): Promise<string | null> {
  const existente = await linkCurtoDaPeca(cliente, destino);
  if (existente) return existente;
  for (const codigo of variantesCodigo(sugerirCodigo(titulo))) {
    const { error } = await cliente.from('links_curtos').insert({ codigo, destino });
    if (!error) return codigo;
    if (error.code !== '23505') {
      console.error('link curto:', error.message);
      return null;
    }
  }
  return null;
}
