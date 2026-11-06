import { describe, expect, it } from 'vitest';
import { linhasManchete, textoManchete } from './manchete';

describe('linhasManchete', () => {
  it('quebra a linha onde o autor pôs |', () => {
    expect(linhasManchete('Direito | nenhum caiu do céu.')).toEqual([
      [{ texto: 'Direito', destaque: false }],
      [{ texto: 'nenhum caiu do céu.', destaque: false }],
    ]);
  });

  it('marca *trecho* como destaque dentro da linha', () => {
    expect(linhasManchete('Caiu do céu. *Foi luta.*')).toEqual([
      [
        { texto: 'Caiu do céu. ', destaque: false },
        { texto: 'Foi luta.', destaque: true },
      ],
    ]);
  });

  it('sem marcação vira uma linha só', () => {
    expect(linhasManchete('Férias não caíram do céu')).toEqual([[{ texto: 'Férias não caíram do céu', destaque: false }]]);
  });
});

describe('textoManchete', () => {
  it('tira as marcações para título da aba, RSS e contagem de palavras', () => {
    expect(textoManchete('Direito | nenhum *caiu* do céu.')).toBe('Direito nenhum caiu do céu.');
  });
});
