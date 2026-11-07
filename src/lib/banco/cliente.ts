// Clientes do Supabase no servidor. A chave anon é pública por natureza; a service_role nunca entra aqui.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

function ambiente(nome: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  const v = process.env[nome] ?? import.meta.env[nome];
  if (!v) throw new Error(`${nome} não definida`);
  return v;
}

export const urlBanco = () => ambiente('SUPABASE_URL');

let publico: SupabaseClient | undefined;

// Páginas públicas: sem sessão, só enxerga o que está publicado (RLS).
export function clientePublico(): SupabaseClient {
  publico ??= createClient(urlBanco(), ambiente('SUPABASE_ANON_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  return publico;
}

// Painel: sessão nos cookies da requisição (HttpOnly, Secure, SameSite=Lax).
export function clienteDaRequisicao(contexto: { request: Request; cookies: AstroCookies }): SupabaseClient {
  return createServerClient(urlBanco(), ambiente('SUPABASE_ANON_KEY'), {
    cookieOptions: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => parseCookieHeader(contexto.request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (lista) => lista.forEach(({ name, value, options }) => contexto.cookies.set(name, value, options)),
    },
  });
}
