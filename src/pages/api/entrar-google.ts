// Alto impacto: manda para o login Google (PKCE, com o verificador num cookie) e volta para a votação.
import type { APIRoute } from 'astro';
import { clienteDaRequisicao } from '../../lib/banco/cliente';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const slug = url.searchParams.get('votacao') ?? '';
  const es = url.searchParams.get('idioma') === 'es';
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response(null, { status: 303, headers: { Location: es ? '/es/votacoes' : '/votacoes' } });
  const volta = new URL('/api/voltou-google', url.origin);
  volta.searchParams.set('votacao', slug);
  if (es) volta.searchParams.set('idioma', 'es');
  const { data, error } = await clienteDaRequisicao({ request, cookies }).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: volta.toString(), skipBrowserRedirect: true } });
  const destino = error || !data.url ? `${es ? '/es' : ''}/votacoes/${slug}` : data.url;
  return new Response(null, { status: 303, headers: { Location: destino, 'Cache-Control': 'private, no-store' } });
};
