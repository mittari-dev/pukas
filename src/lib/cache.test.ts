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
    expect(deveGuardar('GET', '/painel', 200)).toBe(false);
    expect(deveGuardar('GET', '/painel/peca/1', 200)).toBe(false);
    expect(deveGuardar('GET', '/api/renovar', 200)).toBe(false);
    // Votações mudam a cada voto e mostram o comprovante de quem votou: nunca na borda.
    expect(deveGuardar('GET', '/votacoes', 200)).toBe(false);
    expect(deveGuardar('GET', '/votacoes/x', 200)).toBe(false);
    expect(deveGuardar('GET', '/es/votacoes/x', 200)).toBe(false);
    expect(deveGuardar('GET', '/votacoesx', 200)).toBe(true);
  });
});
