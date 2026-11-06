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
  it('tira as marcações de quebra e destaque do título', () => {
    const marcada = { ...edicao, data: { ...edicao.data, titulo: 'Férias | não caíram *do céu*' } };
    expect(itensRss([marcada])[0].title).toBe('Nº 001 — Férias não caíram do céu');
  });

  it('em espanhol, o link aponta para /es', () => {
    expect(itensRss([edicao], 'es')[0].link).toBe('/es/newsletter/memoria-operaria/001/');
  });

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
