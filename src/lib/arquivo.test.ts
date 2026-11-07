import { describe, expect, test } from 'vitest';
import { montarArquivo } from './arquivo';

const pecas = [
  { id: 'b', tipo: 'newsletter', serie: 'memoria-operaria', numero: 2, titulo: 'Dois', atualizado_em: '2026-11-06T10:00:00Z', criado_por: 'u1', fontes: [{ url: 'x', titulo: 't' }] },
  { id: 'a', tipo: 'newsletter', serie: 'memoria-operaria', numero: 1, titulo: 'Um', atualizado_em: '2026-11-05T10:00:00Z', criado_por: 'u1', fontes: [] },
  { id: 'c', tipo: 'pagina', slug: 'manifesto', titulo: 'Manifesto', atualizado_em: '2026-11-04T10:00:00Z', fontes: [] },
];
const traducoes = [
  { peca_id: 'b', idioma: 'es', titulo: 'Dos', atualizado_em: '2026-11-06T11:00:00Z' },
  { peca_id: 'a', idioma: 'es', titulo: 'Uno', atualizado_em: '2026-11-06T11:00:00Z' },
];
const correcoes = [
  { id: '2', peca_id: 'a', data: '2026-11-06', texto: 'Data errada.' },
  { id: '1', peca_id: 'a', data: '2026-11-05', texto: 'Nome errado.' },
];

describe('montarArquivo', () => {
  test('a mesma entrada embaralhada dá a mesma string', () => {
    const embaralhar = <T,>(l: T[]) => [...l].reverse().map((o) => Object.fromEntries(Object.entries(o as object).reverse()) as T);
    expect(montarArquivo(embaralhar(pecas), embaralhar(traducoes), embaralhar(correcoes))).toBe(montarArquivo(pecas, traducoes, correcoes));
  });

  test('sem datas de edição nem quem editou', () => {
    const s = montarArquivo(pecas, traducoes, correcoes);
    expect(s).not.toContain('atualizado_em');
    expect(s).not.toContain('criado_por');
    expect(JSON.parse(s).pecas.map((p: { id: string }) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
