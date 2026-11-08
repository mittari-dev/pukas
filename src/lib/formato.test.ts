import { describe, expect, it } from 'vitest';
import { caminhoCurto, caminhoEdicao, formatarData, formatarNumero, minutosDeLeitura } from './formato';

describe('formatarNumero', () => {
  it.each([
    [0, 'Nº 000'],
    [1, 'Nº 001'],
    [42, 'Nº 042'],
    [1234, 'Nº 1234'],
  ])('%i → %s', (n, esperado) => {
    expect(formatarNumero(n)).toBe(esperado);
  });
});

describe('caminhos', () => {
  it('monta o caminho da edição por série', () => {
    expect(caminhoEdicao('memoria-operaria', 1)).toBe('/newsletter/memoria-operaria/001');
  });

  it('monta o endereço curto do carrossel', () => {
    expect(caminhoCurto(7)).toBe('/007');
  });
});

describe('formatarData', () => {
  it('formata em caixa alta com mês abreviado', () => {
    expect(formatarData(new Date('2026-11-09'))).toBe('09 NOV 2026');
  });

  // new Date('AAAA-MM-DD') é meia-noite UTC; no fuso de Brasília cairia no dia anterior.
  it('usa UTC e não volta um dia no Brasil', () => {
    expect(formatarData(new Date('2026-01-01'))).toBe('01 JAN 2026');
  });
});

describe('minutosDeLeitura', () => {
  it('200 palavras por minuto, arredondado, nunca menos de 1', () => {
    expect(minutosDeLeitura('')).toBe(1);
    expect(minutosDeLeitura('palavra '.repeat(150))).toBe(1);
    expect(minutosDeLeitura('palavra '.repeat(700))).toBe(4);
  });
  it('não conta a marcação do Markdown nem endereços de imagem', () => {
    expect(minutosDeLeitura(`## Título

![foto](https://x.com/${'a/'.repeat(500)}b.jpg)

Uma frase.`)).toBe(1);
  });
});
