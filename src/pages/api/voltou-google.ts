// Volta do login Google: troca o código pela sessão (cookies HttpOnly) e leva de volta à votação, já com os botões.
import type { APIRoute } from 'astro';
import { clienteDaRequisicao } from '../../lib/banco/cliente';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const slug = url.searchParams.get('votacao') ?? '';
  const prefixo = url.searchParams.get('idioma') === 'es' ? '/es' : '';
  const codigo = url.searchParams.get('code');
  if (codigo) {
    const { error } = await clienteDaRequisicao({ request, cookies }).auth.exchangeCodeForSession(codigo);
    if (error) console.error('voltou-google:', error.message);
  }
  const destino = /^[a-z0-9-]{1,80}$/.test(slug) ? `${prefixo}/votacoes/${slug}` : `${prefixo}/votacoes`;
  return new Response(null, { status: 303, headers: { Location: destino, 'Cache-Control': 'private, no-store' } });
};
