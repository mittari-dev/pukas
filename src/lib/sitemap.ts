// Mapa do site e robots.txt, para o Google achar as matérias novas logo (src/pages/sitemap.xml.ts e robots.txt.ts).
export interface Entrada {
  caminho: string;
  atualizado?: Date;
}

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const espanhol = (caminho: string) => (caminho === '/' ? '/es' : `/es${caminho}`);

export function montarSitemap(site: string, entradas: Entrada[]): string {
  const urls = entradas.flatMap((e) => [e.caminho, espanhol(e.caminho)].map((c) => {
    const data = e.atualizado ? `<lastmod>${e.atualizado.toISOString().slice(0, 10)}</lastmod>` : '';
    return `<url><loc>${escapar(site + c)}</loc>${data}</url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

export function montarRobots(site: string): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /painel', 'Disallow: /api/', 'Disallow: /ir/', '', `Sitemap: ${site}/sitemap.xml`, ''].join('\n');
}
