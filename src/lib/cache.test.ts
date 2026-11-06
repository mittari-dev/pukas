import { describe, expect, test } from 'vitest';
import { cabecalhosPublicos, deveGuardar } from './cache';

describe('cache da borda', () => {
  test('cabeçalhos das páginas públicas', () => {
    expect(cabecalhosPublicos()).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=31536000, stale-while-revalidate=31536000',
    });
  });

  test('guarda só GET 200 fora do painel e da API', () => {
    expect(deveGuardar('GET', '/manifesto', 200)).toBe(true);
    expect(deveGuardar('GET', '/es/rss.xml', 200)).toBe(true);
    expect(deveGuardar('GET', '/manifesto', 503)).toBe(false);
    expect(deveGuardar('GET', '/nao-existe', 404)).toBe(false);
    expect(deveGuardar('POST', '/manifesto', 200)).toBe(false);
    expect(deveGuardar('GET', '/admin', 200)).toBe(false);
    expect(deveGuardar('GET', '/admin/peca/1', 200)).toBe(false);
    expect(deveGuardar('GET', '/api/renovar', 200)).toBe(false);
  });
});
