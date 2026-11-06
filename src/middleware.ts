// Middleware do Astro (roda dentro da função, depois do cache). O idioma é decidido antes, em /middleware.ts.
// Aqui: cache da borda e etiquetas nas páginas públicas, e "volte em instantes" quando o banco falha.
import { defineMiddleware } from 'astro:middleware';
import { addCacheTag } from '@vercel/functions';
import { ETIQUETA_INDICE, ETIQUETA_TUDO, cabecalhosPublicos, deveGuardar } from './lib/cache';
import { paginaDeErro } from './lib/erro';

export const onRequest = defineMiddleware(async (contexto, next) => {
  const { pathname } = contexto.url;
  let resposta: Response;
  try {
    resposta = await next();
  } catch (erro) {
    console.error(erro);
    return paginaDeErro(pathname);
  }
  if (resposta.status >= 500) return paginaDeErro(pathname);

  if (!deveGuardar(contexto.request.method, pathname, resposta.status)) {
    if (resposta.status === 404) resposta.headers.set('Cache-Control', 'no-store');
    return resposta;
  }
  for (const [nome, valor] of Object.entries(cabecalhosPublicos())) resposta.headers.set(nome, valor);
  try {
    await addCacheTag([...(contexto.locals.etiquetas ?? [ETIQUETA_INDICE]), ETIQUETA_TUDO]);
  } catch {
    // Fora do Vercel (dev, testes) não há cache da borda para etiquetar.
  }
  return resposta;
});
