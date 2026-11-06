import { describe, expect, it } from 'vitest';
import { obrasPublicadas, rotuloTipo, validarNumerosObras, validarObra, type Obra } from './cultura';

function obra(id: string, sobrescrever: Partial<Obra['data']> = {}): Obra {
  return {
    id,
    data: {
      tipo: 'conto',
      numero: 1,
      titulo: 'A marmita',
      resumo: 'Um conto.',
      publicadaEm: new Date('2026-11-10'),
      autoria: 'PUKAS',
      fontes: [],
      rascunho: false,
      ...sobrescrever,
    },
  };
}

describe('validarObra', () => {
  it('aceita obra sem capa', () => {
    expect(validarObra(obra('a'))).toEqual([]);
  });

  it('aceita capa com crédito e licença', () => {
    expect(validarObra(obra('a', { capa: { arquivo: {}, descricao: 'x', credito: 'Fulano', licenca: 'CC BY 4.0' } }))).toEqual([]);
  });

  it('recusa capa sem licença e sem crédito', () => {
    expect(validarObra(obra('a', { capa: { arquivo: {}, descricao: 'x' } }))).toEqual(['capa sem licença', 'capa sem crédito']);
  });

  it('não exige fonte de ficção', () => {
    expect(validarObra(obra('a', { tipo: 'poema', fontes: [] }))).toEqual([]);
  });
});

describe('validarNumerosObras', () => {
  it('lança erro com os dois ids quando o número se repete', () => {
    expect(() => validarNumerosObras([obra('a', { numero: 2 }), obra('b', { numero: 2 })])).toThrow('Número repetido na Cultura: Nº 002 (a, b)');
  });
});

describe('obrasPublicadas', () => {
  it('devolve vazio sem obras', () => {
    expect(obrasPublicadas([])).toEqual([]);
  });

  it('exclui rascunhos e ordena do número maior para o menor', () => {
    const lista = obrasPublicadas([obra('a', { numero: 1 }), obra('b', { numero: 3, rascunho: true }), obra('c', { numero: 2 })]);
    expect(lista.map((o) => o.id)).toEqual(['c', 'a']);
  });
});

describe('rotuloTipo', () => {
  it.each([
    ['conto', 'CONTO'],
    ['cena', 'CENA'],
    ['poema', 'POEMA'],
    ['ensaio', 'ENSAIO'],
  ] as const)('%s → %s', (tipo, rotulo) => {
    expect(rotuloTipo(tipo)).toBe(rotulo);
  });
});
