// Vercel Routing Middleware: escolhe o idioma antes de servir a página estática (spec espanhol §4).
// A decisão é pura e testada em src/lib/escolhaIdioma.ts; aqui só se leem cabeçalhos e se aplica o resultado.
import { geolocation, next } from '@vercel/functions';
import { decidirRedirecionamento } from './src/lib/escolhaIdioma';

const COOKIE = 'pukas_idioma';
const UM_ANO = 60 * 60 * 24 * 365;

export const config = {
  // Só páginas: nada de arquivos (/_astro, fontes, imagens, rss.xml) nem caminhos com ponto.
  matcher: ['/((?!_astro/|_vercel/|.*\\..*).*)'],
};

function lerCookie(cabecalho: string | null, nome: string): string | undefined {
  return cabecalho
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === nome)?.[1];
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const decisao = decidirRedirecionamento(url, {
    cookie: lerCookie(request.headers.get('cookie'), COOKIE),
    acceptLanguage: request.headers.get('accept-language') ?? undefined,
    pais: geolocation(request).country,
  });

  if (!decisao.destino) return next();

  const headers = new Headers({
    Location: new URL(decisao.destino, url).toString(),
    'Cache-Control': 'private, no-store',
    Vary: 'Accept-Language, Cookie',
  });
  if (decisao.gravarCookie) {
    headers.append('Set-Cookie', `${COOKIE}=${decisao.gravarCookie}; Path=/; Max-Age=${UM_ANO}; SameSite=Lax; Secure`);
  }
  return new Response(null, { status: 302, headers });
}
