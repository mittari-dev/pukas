import { describe, expect, test } from 'vitest';
import { autorizado, etiquetasValidas } from './renovar';

describe('/api/renovar', () => {
  test('sem Authorization ou com segredo errado não passa', () => {
    expect(autorizado(null, 's3gredo')).toBe(false);
    expect(autorizado('Bearer errado', 's3gredo')).toBe(false);
    expect(autorizado('Bearer s3gredo', undefined)).toBe(false);
    expect(autorizado('Bearer s3gredo', 's3gredo')).toBe(true);
  });

  test('só etiquetas no formato do site', () => {
    expect(etiquetasValidas({ etiquetas: ['indice', 'peca:0b6f3c1e-1a2b', 'tudo; drop', 3] })).toEqual(['indice', 'peca:0b6f3c1e-1a2b']);
    expect(etiquetasValidas(null)).toEqual([]);
  });
});
