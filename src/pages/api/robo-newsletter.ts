// Robô diário da newsletter (.github/workflows/newsletter.yml): boas-vindas que venceram e limpeza de pedidos não confirmados.
import type { APIRoute } from 'astro';
import { autorizado } from '../../lib/renovar';
import { rodarRobo } from '../../lib/newsletter/fluxo';

export const POST: APIRoute = async ({ request, site }) => {
  if (!autorizado(request.headers.get('authorization'), process.env.RENOVAR_SEGREDO)) return new Response('não autorizado', { status: 401 });
  return Response.json(await rodarRobo(site!.origin));
};
