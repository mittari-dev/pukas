import { describe, expect, test } from 'vitest';
import { slidesDoTexto } from './carrossel';

describe('slidesDoTexto', () => {
  test('cada subtítulo abre um slide; o texto vem sem marcação', () => {
    const s = slidesDoTexto('Primeiro parágrafo com **negrito** e [link](https://x.com).\n\n## A cidade parou\n\nBondes pararam.\n\n![foto](https://f/a.jpg)');
    expect(s).toEqual([
      { titulo: '', texto: 'Primeiro parágrafo com negrito e link.' },
      { titulo: 'A cidade parou', texto: 'Bondes pararam.' },
    ]);
  });
  test('parágrafo longo é cortado em slides de até 45 palavras, sem cortar no meio da palavra', () => {
    const longo = Array.from({ length: 100 }, (_, i) => `p${i}`).join(' ');
    const s = slidesDoTexto(longo);
    expect(s.length).toBe(3);
    for (const x of s) expect(x.texto.split(' ').length).toBeLessThanOrEqual(45);
    expect(s.map((x) => x.texto).join(' ')).toBe(longo);
  });
  test('no máximo 6 slides de texto (o carrossel tem ainda capa, resumo e final)', () => {
    const muitos = Array.from({ length: 12 }, (_, i) => `## Parte ${i}\n\nTexto ${i}.`).join('\n\n');
    expect(slidesDoTexto(muitos)).toHaveLength(6);
  });
  test('sem texto, nenhum slide', () => expect(slidesDoTexto('')).toEqual([]));
});
