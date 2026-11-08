// Link do e-mail de confirmação.
import type { APIRoute } from 'astro';
import { confirmar, paginaNewsletter } from '../../lib/newsletter/fluxo';

export const GET: APIRoute = async ({ url, site }) => {
  const token = url.searchParams.get('t') ?? '';
  let idioma = null;
  try {
    if (/^[0-9a-f]{64}$/.test(token)) idioma = await confirmar(token, site!.origin);
  } catch (e) {
    console.error('confirmar:', e);
  }
  return new Response(null, { status: 303, headers: { Location: paginaNewsletter(idioma ?? 'pt', idioma ? 'confirmada' : 'invalida'), 'Cache-Control': 'private, no-store' } });
};
