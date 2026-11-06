// Renova o cache das páginas pelas etiquetas. Só o workflow que recolhe as traduções chama, com o segredo.
import type { APIRoute } from 'astro';
import { invalidateByTag } from '@vercel/functions';
import { autorizado, etiquetasValidas } from '../../lib/renovar';

export const POST: APIRoute = async ({ request }) => {
  if (!autorizado(request.headers.get('authorization'), process.env.RENOVAR_SEGREDO)) return new Response('não autorizado', { status: 401 });
  const etiquetas = etiquetasValidas(await request.json().catch(() => null));
  if (!etiquetas.length) return new Response('sem etiquetas', { status: 400 });
  await invalidateByTag(etiquetas);
  return new Response(null, { status: 204 });
};
