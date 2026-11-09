import { describe, expect, test } from 'vitest';
import { caminhoPublico, codigoValido, destinoValido, linksDeCompartilhar, sugerirCodigo, variantesCodigo } from './links';

describe('links curtos', () => {
  test('código: minúsculas, números e hífen, até 40', () => {
    for (const bom of ['13-salario', 'pec45', 'a']) expect(codigoValido(bom), bom).toBe(true);
    for (const ruim of ['', '-x', 'Maiuscula', 'com espaço', 'acentuação', 'a/b', 'x'.repeat(41)]) expect(codigoValido(ruim), ruim).toBe(false);
  });

  test('destino só dentro do site (nada de mandar para fora pelo PUKAS)', () => {
    for (const bom of ['/', '/votacoes/pec-45', '/es/newsletter/memoria-operaria/001', '/noticias/x?y=1']) expect(destinoValido(bom), bom).toBe(true);
    for (const ruim of ['https://golpe.com', '//golpe.com', '/\\golpe.com', 'javascript:alert(1)', 'votacoes', '']) expect(destinoValido(ruim), ruim).toBe(false);
  });

  test('sugestão de código vem do título, sem acento nem marcação de manchete', () => {
    expect(sugerirCodigo('O 13º salário | *não caiu do céu*')).toBe('o-13o-salario-nao-caiu-do-ceu');
    expect(sugerirCodigo('x'.repeat(60)).length).toBeLessThanOrEqual(40);
  });

  test('endereço público de cada tipo de peça', () => {
    expect(caminhoPublico({ tipo: 'noticia', id: 'u', slug: 'greve' })).toBe('/noticias/greve');
    expect(caminhoPublico({ tipo: 'cultura', id: 'u', slug: 'poema' })).toBe('/cultura/poema');
    expect(caminhoPublico({ tipo: 'votacao', id: 'u', slug: 'pec-45' })).toBe('/votacoes/pec-45');
    expect(caminhoPublico({ tipo: 'pagina', id: 'u', slug: 'manifesto' })).toBe('/manifesto');
    expect(caminhoPublico({ tipo: 'newsletter', id: 'u', slug: null, serie: 'memoria-operaria', numero: 7 })).toBe('/newsletter/memoria-operaria/007');
    expect(caminhoPublico({ tipo: 'noticia', id: 'uuid-1', slug: null })).toBe('/noticias/uuid-1');
  });

  test('variantes do código para achar um livre: o próprio, depois -2, -3…, sempre válidos e até 40', () => {
    expect(variantesCodigo('greve').slice(0, 3)).toEqual(['greve', 'greve-2', 'greve-3']);
    for (const c of variantesCodigo('x'.repeat(40))) expect(codigoValido(c), c).toBe(true);
    expect(variantesCodigo('')[0]).toBe('pukas');
  });

  test('links de compartilhar com o link curto e o título', () => {
    const l = linksDeCompartilhar('https://pukas.lat/ir/greve', 'A greve & a luta');
    expect(l.whatsapp).toBe(`https://wa.me/?text=${encodeURIComponent('A greve & a luta https://pukas.lat/ir/greve')}`);
    expect(l.x).toContain('twitter.com/intent/tweet?text=A%20greve%20%26%20a%20luta&url=https%3A%2F%2Fpukas.lat%2Fir%2Fgreve');
    expect(l.facebook).toContain('sharer.php?u=https%3A%2F%2Fpukas.lat%2Fir%2Fgreve');
    expect(l.telegram).toContain('t.me/share/url?url=');
    expect(l.threads).toContain('threads.net/intent/post?text=');
  });
});
