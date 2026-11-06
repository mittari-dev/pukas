import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { carregarEdicoes } from '../lib/carregar';
import { itensRss } from '../lib/rss';

export async function GET(context: APIContext) {
  return rss({
    title: 'PUKAS — Memória Operária',
    description: 'Direitos que existem porque alguém lutou. Uma edição toda segunda, sempre com as fontes.',
    site: context.site ?? 'https://pukas.vercel.app',
    items: itensRss(await carregarEdicoes()),
    customData: '<language>pt-BR</language>',
  });
}
