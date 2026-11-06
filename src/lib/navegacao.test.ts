import { describe, expect, it } from 'vitest';
import { secaoAtiva } from './navegacao';

const itens = [
  { rotulo: 'Memória Operária', href: '/newsletter/memoria-operaria' },
  { rotulo: 'Cultura', href: '/cultura' },
  { rotulo: 'Manifesto', href: '/manifesto' },
];

describe('secaoAtiva', () => {
  it('marca a seção pela página índice', () => {
    expect(secaoAtiva('/cultura', itens)).toBe('/cultura');
  });

  it('marca a seção numa página interna', () => {
    expect(secaoAtiva('/newsletter/memoria-operaria/001', itens)).toBe('/newsletter/memoria-operaria');
  });

  it('ignora barra final', () => {
    expect(secaoAtiva('/cultura/a-marmita/', itens)).toBe('/cultura');
  });

  it('não confunde prefixo parecido', () => {
    expect(secaoAtiva('/culturas', itens)).toBeUndefined();
  });

  it('não marca nada na capa quando não há item de início', () => {
    expect(secaoAtiva('/', itens)).toBeUndefined();
  });

  const comInicio = [{ rotulo: 'Início', href: '/' }, ...itens];

  it('marca Início só na capa', () => {
    expect(secaoAtiva('/', comInicio)).toBe('/');
  });

  it('não marca Início dentro de outra seção', () => {
    expect(secaoAtiva('/cultura/a-marmita', comInicio)).toBe('/cultura');
  });
});
