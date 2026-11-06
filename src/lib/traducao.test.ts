import { describe, expect, it } from 'vitest';
import { aplicarTraducoes, mesclarEdicao, mesclarObra, numerosDoTexto, problemasDaTraducao, validarNumerosTraducao } from './traducao';
import type { Edicao } from './edicoes';
import type { Obra } from './cultura';

describe('numerosDoTexto', () => {
  it('extrai e ordena, tratando ponto de milhar como parte do número', () => {
    expect(numerosDoTexto('Em 1925, 15 dias e 1.000 operários')).toEqual(['1000', '15', '1925']);
  });

  it('mantém repetições', () => {
    expect(numerosDoTexto('8 horas, 8 horas, 8 horas')).toEqual(['8', '8', '8']);
  });

  it('ordinal conta pelo número', () => {
    expect(numerosDoTexto('o 13º salário')).toEqual(['13']);
  });
});

describe('validarNumerosTraducao', () => {
  it('aceita quando os números batem', () => {
    expect(validarNumerosTraducao('Em 1925, 15 dias.', 'En 1925, 15 días.')).toEqual([]);
  });

  it('lista o que falta e o que sobra', () => {
    expect(validarNumerosTraducao('Em 1925, 15 dias.', 'En 1926, 15 días.')).toEqual(['faltam: 1925', 'sobram: 1926']);
  });
});

const trad = { titulo: 'Las vacaciones | no cayeron del cielo', resumo: 'Resumen.', legenda: 'Leyenda.', revisado: false, modelo: 'claude-opus-5-5' };

describe('mesclarEdicao', () => {
  const original: Edicao = {
    id: 'memoria-operaria/001-ferias',
    data: {
      serie: 'memoria-operaria',
      numero: 1,
      titulo: 'Férias | não caíram do céu',
      publicadaEm: new Date('2026-11-09'),
      resumo: 'Resumo.',
      legenda: 'Legenda.',
      foto: { arquivo: {}, descricao: 'x', credito: 'AN', licenca: 'DP' },
      fontes: [{ titulo: 'Lei', instituicao: 'Planalto', url: 'https://x.org', tipo: 'primaria', acessadaEm: new Date('2026-11-01') }],
      checagem: { por: 'F', em: new Date('2026-11-05') },
      correcoes: [],
      rascunho: false,
    },
  };

  it('troca só o texto e preserva os dados do original', () => {
    const m = mesclarEdicao(original, trad);
    expect(m.data.titulo).toBe('Las vacaciones | no cayeron del cielo');
    expect(m.data.resumo).toBe('Resumen.');
    expect(m.data.legenda).toBe('Leyenda.');
    expect(m.data.numero).toBe(1);
    expect(m.data.fontes).toBe(original.data.fontes);
    expect(m.data.checagem).toBe(original.data.checagem);
    expect(m.traducao).toEqual({ revisado: false, modelo: 'claude-opus-5-5' });
  });
});

describe('problemasDaTraducao', () => {
  const original = { titulo: 'Férias | não caíram *do céu*', corpo: 'Em 1925, 15 dias.' };

  it('aceita tradução fiel', () => {
    expect(problemasDaTraducao(original, { titulo: 'Las vacaciones | no cayeron *del cielo*', corpo: 'En 1925, 15 días.' })).toEqual([]);
  });

  it('acusa quebra de linha perdida na manchete', () => {
    expect(problemasDaTraducao(original, { titulo: 'Las vacaciones no cayeron *del cielo*', corpo: 'En 1925, 15 días.' })).toEqual([
      'manchete com 0 "|" (original tem 1)',
    ]);
  });

  it('acusa destaque perdido e número trocado', () => {
    expect(problemasDaTraducao(original, { titulo: 'Las vacaciones | no cayeron del cielo', corpo: 'En 1926, 15 días.' })).toEqual([
      'manchete com 0 "*" (original tem 2)',
      'faltam: 1925',
      'sobram: 1926',
    ]);
  });
});

describe('aplicarTraducoes', () => {
  const orig = (id: string, titulo: string, body: string) => ({ id, body, data: { numero: 1, titulo } });
  const tr = (id: string, titulo: string, body: string) => ({ id, body, data: { titulo, resumo: 'r', revisado: false } });
  const mesclar = (o: ReturnType<typeof orig>, t: { titulo: string }) => ({ ...o, data: { ...o.data, titulo: t.titulo } });

  it('devolve só os originais que têm tradução, já mesclados', () => {
    const r = aplicarTraducoes([orig('a', 'A', 'Em 1925.'), orig('b', 'B', 'x')], [tr('a', 'A-es', 'En 1925.')], mesclar);
    expect(r.map((x) => [x.id, x.data.titulo])).toEqual([['a', 'A-es']]);
  });

  it('trava o build quando um número muda na tradução', () => {
    expect(() => aplicarTraducoes([orig('a', 'Lei de 1925', 'Em 1925, 15 dias.')], [tr('a', 'Ley de 1925', 'En 1926, 15 días.')], mesclar)).toThrow(
      /a: faltam: 1925; sobram: 1926/,
    );
  });

  it('ignora tradução sem original publicado', () => {
    expect(aplicarTraducoes([], [tr('x', 'X', '')], mesclar)).toEqual([]);
  });
});

describe('mesclarObra', () => {
  const original: Obra = {
    id: 'a-marmita',
    data: { tipo: 'conto', numero: 2, titulo: 'A marmita', resumo: 'R.', publicadaEm: new Date('2026-11-10'), autoria: 'PUKAS', aviso: 'Aviso.', fontes: [], rascunho: false, traduzir: true },
  };

  it('troca título, resumo e aviso', () => {
    const m = mesclarObra(original, { titulo: 'La marmita', resumo: 'Re.', aviso: 'Advertencia.', revisado: true });
    expect([m.data.titulo, m.data.resumo, m.data.aviso, m.data.numero, m.data.tipo]).toEqual(['La marmita', 'Re.', 'Advertencia.', 2, 'conto']);
    expect(m.traducao).toEqual({ revisado: true, modelo: undefined });
  });
});
