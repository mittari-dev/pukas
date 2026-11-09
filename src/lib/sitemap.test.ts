import { describe, expect, test } from 'vitest';
import { montarRobots, montarSitemap } from './sitemap';

describe('sitemap', () => {
  test('cada endereço em português e em espanhol, com a data da última mudança', () => {
    const xml = montarSitemap('https://pukas.lat', [{ caminho: '/noticias/greve', atualizado: new Date('2026-11-07T10:00:00Z') }, { caminho: '/' }]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<loc>https://pukas.lat/noticias/greve</loc><lastmod>2026-11-07</lastmod>');
    expect(xml).toContain('<loc>https://pukas.lat/es/noticias/greve</loc>');
    expect(xml).toContain('<loc>https://pukas.lat/</loc>');
    expect(xml).toContain('<loc>https://pukas.lat/es</loc>');
  });
  test('escapa & no endereço', () => {
    expect(montarSitemap('https://pukas.lat', [{ caminho: '/a&b' }])).toContain('/a&amp;b');
  });
  test('robots: tudo aberto, menos painel, api e links curtos; aponta o sitemap', () => {
    const r = montarRobots('https://pukas.lat');
    expect(r).toContain('Disallow: /painel');
    expect(r).toContain('Disallow: /api/');
    expect(r).toContain('Disallow: /ir/');
    expect(r).toContain('Sitemap: https://pukas.lat/sitemap.xml');
  });
});
