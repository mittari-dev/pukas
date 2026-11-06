import { describe, expect, it } from 'vitest';
import { itensRss } from './rss';
import type { Edicao } from './edicoes';

const edicao = {
  id: 'memoria-operaria/001-ferias',
  data: {
    serie: 'memoria-operaria',
    numero: 1,
    titulo: 'Férias não caíram do céu',
    publicadaEm: new Date('2026-11-09'),
    resumo: 'Antes de 1925, ninguém tinha férias.',
    foto: { arquivo: {}, descricao: 'x' },
    fontes: [],
    correcoes: [],
    rascunho: false,
  },
} satisfies Edicao;

describe('itensRss', () => {
  it('devolve lista vazia sem edições', () => {
    expect(itensRss([])).toEqual([]);
  });

  it('monta título com número, link da edição, data e resumo', () => {
    expect(itensRss([edicao])).toEqual([
      {
        title: 'Nº 001 — Férias não caíram do céu',
        link: '/newsletter/memoria-operaria/001/',
        pubDate: new Date('2026-11-09'),
        description: 'Antes de 1925, ninguém tinha férias.',
      },
    ]);
  });
});
