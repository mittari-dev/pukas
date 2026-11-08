// Link curto: pukas.lat/ir/<código> leva para uma página do site e conta o clique (painel → Links).
import type { APIRoute } from 'astro';
import { mestre } from '../../lib/banco/equipe';
import { codigoValido, destinoValido } from '../../lib/links';

export const GET: APIRoute = async ({ params }) => {
  const codigo = (params.codigo ?? '').toLowerCase();
  let destino = '/';
  if (codigoValido(codigo)) {
    const { data } = await mestre().rpc('seguir_link', { c: codigo });
    if (typeof data === 'string' && destinoValido(data)) destino = data;
  }
  return new Response(null, { status: 302, headers: { Location: destino, 'Cache-Control': 'private, no-store' } });
};
