// Pede ao Storage um endereço de envio para uma mídia do texto. O arquivo sobe do navegador direto para lá (public/editor.js).
import type { APIRoute } from 'astro';
import { pedirEnvioMidia } from '../../lib/banco/painel';
import { urlBanco } from '../../lib/banco/cliente';

export const POST: APIRoute = async ({ locals, request }) => {
  const { cliente, usuario } = locals.painel!;
  if (usuario?.papel !== 'editor') return Response.json({ erro: 'Só quem é editor envia mídia.' }, { status: 403 });
  const { tipo } = (await request.json().catch(() => ({}))) as { tipo?: unknown };
  const r = await pedirEnvioMidia(cliente, typeof tipo === 'string' ? tipo : '', urlBanco());
  return r.ok ? Response.json(r.valor) : Response.json({ erro: r.erro }, { status: 400 });
};
