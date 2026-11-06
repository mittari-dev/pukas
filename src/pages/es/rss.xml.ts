import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { carregarEdicoes } from '../../lib/carregar';
import { t } from '../../lib/idioma';
import { itensRss } from '../../lib/rss';

export async function GET(context: APIContext) {
  return rss({
    title: t('es', 'rss.titulo'),
    description: t('es', 'rss.descricao'),
    site: context.site ?? 'https://pukas.vercel.app',
    items: itensRss(await carregarEdicoes('es'), 'es'),
    customData: '<language>es-419</language>',
  });
}
