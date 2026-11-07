import { describe, expect, test } from 'vitest';
import { anoDoJornal, linhaDoCabecalho, ultimaPublicacao } from './jornal';

describe('anoDoJornal', () => {
  test('2026 é o ano I; conta em algarismos romanos', () => {
    expect(anoDoJornal(new Date('2026-11-07T12:00:00Z'))).toBe('I');
    expect(anoDoJornal(new Date('2027-01-01T12:00:00Z'))).toBe('II');
    expect(anoDoJornal(new Date('2029-06-01T12:00:00Z'))).toBe('IV');
  });
});

describe('ultimaPublicacao', () => {
  test('a mais recente entre edições, notícias e obras; nada publicado dá undefined', () => {
    const p = (s: string) => ({ data: { publicadaEm: new Date(s) } });
    expect(ultimaPublicacao([p('2026-11-02'), p('2026-11-09')], [p('2026-11-05')])).toEqual(new Date('2026-11-09'));
    expect(ultimaPublicacao([], [])).toBeUndefined();
  });
});

describe('linhaDoCabecalho', () => {
  test('data da última publicação (a capa fica em cache até publicar de novo), lugar, ano e preço', () => {
    expect(linhaDoCabecalho(new Date('2026-11-09T12:00:00Z'), 'pt')).toEqual(['ATUALIZADO EM 09 NOV 2026', 'CABO FRIO — AMÉRICA LATINA', 'ANO I', 'GRÁTIS, PASSE ADIANTE']);
    expect(linhaDoCabecalho(new Date('2026-11-09T12:00:00Z'), 'es')).toEqual(['ACTUALIZADO EL 09 NOV 2026', 'CABO FRIO — AMÉRICA LATINA', 'AÑO I', 'GRATIS, PÁSALO']);
  });

  test('sem nada publicado, sem data e sem ano (que dependeria do relógio)', () => {
    expect(linhaDoCabecalho(undefined, 'pt')).toEqual(['CABO FRIO — AMÉRICA LATINA', 'GRÁTIS, PASSE ADIANTE']);
  });
});
