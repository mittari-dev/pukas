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
    // O feed se chama Memória Operária: só as edições dela.
    items: itensRss(await carregarEdicoes('es', 'memoria-operaria'), 'es'),
    customData: '<language>es-419</language>',
  });
}
