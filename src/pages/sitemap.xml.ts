// Mapa do site para buscadores: as seções e cada peça publicada, em português e espanhol.
import type { APIRoute } from 'astro';
import { clientePublico } from '../lib/banco/cliente';
import { caminhoPublico } from '../lib/links';
import { montarSitemap, type Entrada } from '../lib/sitemap';

const SECOES = ['/', '/noticias', '/newsletter', '/votacoes', '/materias', '/cultura', '/manifesto', '/links'];

export const GET: APIRoute = async ({ site }) => {
  const { data, error } = await clientePublico().from('pecas').select('id, tipo, slug, serie, numero, atualizado_em').eq('estado', 'publicada');
  if (error) throw new Error(error.message);
  const pecas: Entrada[] = (data ?? [])
    .filter((p) => p.tipo !== 'pagina' || p.slug === 'privacidade')
    .map((p) => ({ caminho: caminhoPublico(p), atualizado: new Date(p.atualizado_em) }));
  const xml = montarSitemap(site!.origin, [...SECOES.map((caminho) => ({ caminho })), ...pecas]);
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
