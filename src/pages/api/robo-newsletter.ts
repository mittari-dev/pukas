// Robô diário (.github/workflows/newsletter.yml): boas-vindas que venceram, limpeza de pedidos não confirmados
// e das contas Google de voto que ficaram para trás.
import type { APIRoute } from 'astro';
import { autorizado } from '../../lib/renovar';
import { rodarRobo } from '../../lib/newsletter/fluxo';
import { limparContasDeVoto } from '../../lib/banco/votos';

export const POST: APIRoute = async ({ request, site }) => {
  if (!autorizado(request.headers.get('authorization'), process.env.RENOVAR_SEGREDO)) return new Response('não autorizado', { status: 401 });
  const newsletter = await rodarRobo(site!.origin);
  return Response.json({ ...newsletter, contasDeVotoApagadas: await limparContasDeVoto() });
};
