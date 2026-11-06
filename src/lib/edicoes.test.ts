import { describe, expect, it } from 'vitest';
import {
  contarPalavras,
  edicoesPublicadas,
  ordenarFontes,
  validarNumerosUnicos,
  validarPublicavel,
  type Edicao,
} from './edicoes';

function edicao(id: string, sobrescrever: Partial<Edicao['data']> = {}): Edicao {
  return {
    id,
    data: {
      serie: 'memoria-operaria',
      numero: 1,
      titulo: 'Férias não caíram do céu',
      publicadaEm: new Date('2026-11-09'),
      resumo: 'Resumo.',
      foto: { arquivo: {}, descricao: 'Operários em greve', credito: 'Arquivo Nacional', licenca: 'Domínio público' },
      fontes: [
        { titulo: 'Lei nº 4.982', instituicao: 'Planalto', url: 'https://example.org', tipo: 'primaria', acessadaEm: new Date('2026-11-01') },
      ],
      checagem: { por: 'Fundador', em: new Date('2026-11-05') },
      correcoes: [],
      rascunho: false,
      ...sobrescrever,
    },
  };
}

describe('contarPalavras', () => {
  it('conta número e ordinal como palavra', () => {
    expect(contarPalavras('O 13º salário não foi presente')).toBe(6);
  });

  it('ignora espaços repetidos e nas pontas', () => {
    expect(contarPalavras('  Foi   luta. ')).toBe(2);
  });

  it('conta palavra com hífen como uma', () => {
    expect(contarPalavras('Hora-extra paga')).toBe(2);
  });
});

describe('validarPublicavel', () => {
  it('aceita uma edição completa', () => {
    expect(validarPublicavel(edicao('a'))).toEqual([]);
  });

  it('recusa edição só com fontes secundárias', () => {
    const e = edicao('a', {
      fontes: [{ titulo: 'Blog', instituicao: 'X', url: 'https://x.org', tipo: 'secundaria', acessadaEm: new Date() }],
    });
    expect(validarPublicavel(e)).toEqual(['sem fonte primária']);
  });

  it('recusa foto sem licença', () => {
    const e = edicao('a');
    delete e.data.foto.licenca;
    expect(validarPublicavel(e)).toEqual(['foto sem licença']);
  });

  it('recusa foto sem crédito', () => {
    const e = edicao('a');
    delete e.data.foto.credito;
    expect(validarPublicavel(e)).toEqual(['foto sem crédito']);
  });

  it('recusa edição sem checagem', () => {
    expect(validarPublicavel(edicao('a', { checagem: undefined }))).toEqual(['sem checagem']);
  });

  it('recusa manchete com mais de 8 palavras', () => {
    const e = edicao('a', { titulo: 'um dois três quatro cinco seis sete oito nove' });
    expect(validarPublicavel(e)).toEqual(['manchete com 9 palavras (máx. 8)']);
  });

  it('acumula todos os problemas', () => {
    expect(validarPublicavel(edicao('a', { checagem: undefined, fontes: [] }))).toEqual([
      'sem fonte primária',
      'sem checagem',
    ]);
  });
});

describe('validarNumerosUnicos', () => {
  it('lança erro com os dois ids quando o número se repete na série', () => {
    expect(() => validarNumerosUnicos([edicao('a', { numero: 3 }), edicao('b', { numero: 3 })])).toThrow(
      'Número repetido: Nº 003 (a, b)',
    );
  });

  it('aceita números diferentes', () => {
    expect(() => validarNumerosUnicos([edicao('a', { numero: 1 }), edicao('b', { numero: 2 })])).not.toThrow();
  });
});

describe('ordenarFontes', () => {
  it('põe as primárias antes das secundárias, mantendo a ordem dentro de cada grupo', () => {
    const f = (titulo: string, tipo: 'primaria' | 'secundaria') =>
      ({ titulo, instituicao: 'X', url: 'https://x.org', tipo, acessadaEm: new Date() }) as const;
    const ordem = ordenarFontes([f('s1', 'secundaria'), f('p1', 'primaria'), f('s2', 'secundaria'), f('p2', 'primaria')]);
    expect(ordem.map((x) => x.titulo)).toEqual(['p1', 'p2', 's1', 's2']);
  });
});

describe('edicoesPublicadas', () => {
  it('devolve lista vazia sem edições', () => {
    expect(edicoesPublicadas([])).toEqual([]);
  });

  it('exclui rascunhos', () => {
    const lista = edicoesPublicadas([edicao('a'), edicao('b', { numero: 2, rascunho: true })]);
    expect(lista.map((e) => e.id)).toEqual(['a']);
  });

  it('ordena do número maior para o menor', () => {
    const lista = edicoesPublicadas([edicao('a', { numero: 1 }), edicao('c', { numero: 3 }), edicao('b', { numero: 2 })]);
    expect(lista.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });
});
