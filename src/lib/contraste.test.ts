import { describe, expect, it } from 'vitest';
import { razaoContraste } from './contraste';

describe('razaoContraste', () => {
  it('dá 21 entre branco e preto', () => {
    expect(razaoContraste('#FFFFFF', '#000000')).toBe(21);
  });

  it('é simétrica', () => {
    expect(razaoContraste('#000000', '#FFFFFF')).toBe(21);
  });

  // Pares da paleta v2.0 (docs/design/paleta.md)
  it('Tinta sobre Cal serve para corpo de texto (≥ 7)', () => {
    expect(razaoContraste('#1C1A17', '#F1EDE4')).toBeGreaterThanOrEqual(7);
  });

  it('Cal sobre Pau-Brasil serve para Agitação (≥ 4.5)', () => {
    expect(razaoContraste('#F1EDE4', '#9E2A1E')).toBeGreaterThanOrEqual(4.5);
  });

  it('Ipê sobre Tinta serve para destaque (≥ 4.5)', () => {
    expect(razaoContraste('#E0A526', '#1C1A17')).toBeGreaterThanOrEqual(4.5);
  });

  it('Ipê sobre Verde-Mata serve para o Técnico (≥ 4.5)', () => {
    expect(razaoContraste('#E0A526', '#1A452C')).toBeGreaterThanOrEqual(4.5);
  });

  it('Pau-Brasil sobre Tinta é proibido para texto (< 3)', () => {
    expect(razaoContraste('#9E2A1E', '#1C1A17')).toBeLessThan(3);
  });
});
