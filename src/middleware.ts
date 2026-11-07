// Middleware do Astro (roda dentro da função, depois do cache). O idioma é decidido antes, em /middleware.ts.
// Aqui: a porta do /painel (login + 2FA), o cache da borda nas páginas públicas e o "volte em instantes".
import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { addCacheTag } from '@vercel/functions';
import { ETIQUETA_INDICE, ETIQUETA_TUDO, cabecalhosPublicos, deveGuardar } from './lib/cache';
import { paginaDeErro } from './lib/erro';
import { clienteDaRequisicao, urlBanco } from './lib/banco/cliente';
import { cabecalhosAdmin, decidirAcessoAdmin, enderecoNovo } from './lib/painel/acesso';

async function painel(contexto: APIContext, next: MiddlewareNext): Promise<Response> {
  const cabecalhos = cabecalhosAdmin(urlBanco());
  const caminho = contexto.url.pathname.replace(/(.)\/$/, '$1');
  const cliente = clienteDaRequisicao(contexto);
  const { data: { user } } = await cliente.auth.getUser();
  let aal: 'aal1' | 'aal2' | null = null;
  let temFator = false;
  if (user) {
    const { data } = await cliente.auth.mfa.getAuthenticatorAssuranceLevel();
    aal = (data?.currentLevel as 'aal1' | 'aal2' | null) ?? null;
    temFator = data?.nextLevel === 'aal2';
  }
  const decisao = decidirAcessoAdmin({ caminho, logado: Boolean(user), aal, temFator });
  if (decisao.tipo === 'redirecionar') return new Response(null, { status: 303, headers: { ...cabecalhos, Location: decisao.para } });

  contexto.locals.painel = { cliente };
  if (user && aal === 'aal2') {
    const { data: perfil } = await cliente.from('perfis').select('nome, papel').eq('id', user.id).maybeSingle();
    // Conta sem perfil não é da equipe: sai e volta para o login.
    if (!perfil) {
      await cliente.auth.signOut();
      return new Response(null, { status: 303, headers: { ...cabecalhos, Location: '/painel/entrar?erro=sem-acesso' } });
    }
    contexto.locals.painel.usuario = { id: user.id, email: user.email ?? '', nome: perfil.nome, papel: perfil.papel };
  }
  const resposta = await next();
  for (const [nome, valor] of Object.entries(cabecalhos)) resposta.headers.set(nome, valor);
  return resposta;
}

export const onRequest = defineMiddleware(async (contexto, next) => {
  // Decodificado: /p%61inel também é o painel para o roteador, então tem de passar pela mesma porta.
  let pathname = contexto.url.pathname;
  try {
    pathname = decodeURI(pathname);
  } catch {
    return new Response('endereço inválido', { status: 400 });
  }
  const novo = enderecoNovo(pathname);
  if (novo) return new Response(null, { status: 301, headers: { Location: novo + contexto.url.search, 'Cache-Control': 'no-store' } });
  if (/^\/painel(\/|$)/.test(pathname)) return painel(contexto, next);
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
