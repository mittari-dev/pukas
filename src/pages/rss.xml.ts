import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { carregarEdicoes } from '../lib/carregar';
import { t } from '../lib/idioma';
import { itensRss } from '../lib/rss';

export async function GET(context: APIContext) {
  return rss({
    title: t('pt', 'rss.titulo'),
    description: t('pt', 'rss.descricao'),
    site: context.site ?? 'https://pukas.vercel.app',
    items: itensRss(await carregarEdicoes('pt'), 'pt'),
    customData: '<language>pt-BR</language>',
  });
}
