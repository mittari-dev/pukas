import { describe, expect, test } from 'vitest';
import { travasDaPeca, type PecaEntrada } from './travas';
import { validarPublicavel, type Edicao } from '../edicoes';

const fonte = { titulo: 'Lei', instituicao: 'Planalto', url: 'https://planalto.gov.br', tipo: 'primaria' as const, acessadaEm: new Date('2026-11-01') };
const foto = { caminho: 'a.jpg', descricao: 'Operários', credito: 'Arquivo', licenca: 'Domínio público' };

function newsletter(extra: Partial<PecaEntrada> = {}): PecaEntrada {
  return {
    tipo: 'newsletter', serie: 'memoria-operaria', numero: 1, autoria: 'PUKAS', titulo: 'Direito | nenhum caiu | do céu.',
    resumo: 'r', corpo: 'c', foto, fontes: [fonte], checagem: { por: 'F', em: new Date('2026-11-01') }, traduzir: true, estado: 'rascunho',
    ...extra,
  };
}

const falhas = (p: PecaEntrada) => travasDaPeca(p).filter((t) => !t.ok).map((t) => t.mensagem);

describe('travasDaPeca', () => {
  test('newsletter completa passa em tudo', () => {
    expect(falhas(newsletter())).toEqual([]);
    expect(travasDaPeca(newsletter()).map((t) => t.chave)).toEqual(['fonte', 'foto_licenca', 'foto_credito', 'checagem', 'manchete']);
  });

  test('mesmas mensagens do banco e de validarPublicavel', () => {
    const p = newsletter({ fontes: [{ ...fonte, tipo: 'secundaria' }], foto: { ...foto, licenca: '', credito: undefined }, checagem: undefined, titulo: 'um dois três quatro cinco seis sete oito nove' });
    const esperado = ['sem fonte primária', 'foto sem licença', 'foto sem crédito', 'sem checagem', 'manchete com 9 palavras (máx. 8)'];
    expect(falhas(p)).toEqual(esperado);
    const edicao = { id: 'x', data: { ...p, publicadaEm: new Date(), foto: { arquivo: null, ...p.foto }, correcoes: [], rascunho: false } } as unknown as Edicao;
    expect(validarPublicavel(edicao)).toEqual(esperado);
  });

  test('manchete com | e * conta só palavras', () => {
    expect(falhas(newsletter({ titulo: 'Direito | nenhum caiu | do céu. | *Foi luta.*' }))).toEqual([]);
  });

  test('noticia aceita fonte secundária e exige fonte e checagem', () => {
    const n = newsletter({ tipo: 'noticia', slug: 's', foto: undefined, fontes: [{ ...fonte, tipo: 'secundaria' }] });
    expect(falhas(n)).toEqual([]);
    expect(falhas({ ...n, fontes: [], checagem: undefined })).toEqual(['sem fonte', 'sem checagem']);
  });

  test('cultura só olha a capa, quando existe', () => {
    const c = newsletter({ tipo: 'cultura', subtipo: 'conto', foto: undefined, fontes: [], checagem: undefined, titulo: 'um dois três quatro cinco seis sete oito nove' });
    expect(travasDaPeca(c)).toEqual([]);
    expect(falhas({ ...c, foto: { caminho: 'c.jpg', descricao: 'd', credito: 'X' } })).toEqual(['capa sem licença']);
  });

  test('pagina não tem travas', () => {
    expect(travasDaPeca(newsletter({ tipo: 'pagina', slug: 'manifesto', fontes: [], checagem: undefined, foto: undefined }))).toEqual([]);
  });
});
