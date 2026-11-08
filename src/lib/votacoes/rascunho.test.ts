import { describe, expect, test } from 'vitest';
import { montarRascunho } from './rascunho';

const proposicao = { casa: 'camara' as const, sigla: 'PEC', numero: 45, ano: 2019, id: '2196833', ementa: 'Altera o Sistema Tributário Nacional.', url: 'https://www.camara.leg.br/propostas-legislativas/2196833' };
const fonte = { titulo: 'Agência Câmara', instituicao: 'Câmara', url: 'https://camara.leg.br/noticias', tipo: 'secundaria' as const, acessadaEm: new Date('2026-11-01') };
const base = {
  titulo: 'Reforma | tributária',
  proposicao,
  resultado: { a_favor: 2, contra: 1, nao_sei: 0, descartes: { 'muitos votos da mesma rede': 4 } },
  fontes: [fonte],
};

describe('montarRascunho', () => {
  test('notícia em rascunho com os números e a metodologia', () => {
    const p = montarRascunho(base);
    expect(p).toMatchObject({ tipo: 'noticia', estado: 'rascunho', titulo: 'Reforma | tributária' });
    expect(p.corpo).toContain('67% de quem votou no PUKAS é a favor, 33% contra e 0% não sabe (3 votos válidos; 4 descartados: muitos votos da mesma rede: 4).');
    expect(p.corpo).not.toMatch(/dos trabalhadores|margem/i);
    expect(p.corpo).not.toContain('Na Câmara');
  });
  test('com plenário, o placar da casa', () => {
    const plenario = { idOficial: '1', data: new Date(), descricao: '', sim: 375, nao: 113, abstencao: 3, outros: 0, votos: [] };
    expect(montarRascunho({ ...base, plenario }).corpo).toContain('Na Câmara, foram 375 votos sim e 113 não.');
    expect(montarRascunho({ ...base, proposicao: { ...proposicao, casa: 'senado' }, plenario }).corpo).toContain('No Senado, foram 375 votos sim e 113 não.');
  });
  test('sem descartes, a frase diz 0', () => {
    expect(montarRascunho({ ...base, resultado: { ...base.resultado, descartes: {} } }).corpo).toContain('(3 votos válidos; 0 descartados).');
  });
  test('as fontes da votação mais a proposição como primária', () => {
    const p = montarRascunho(base);
    expect(p.fontes).toHaveLength(2);
    expect(p.fontes[1]).toMatchObject({ titulo: 'PEC 45/2019', instituicao: 'Câmara dos Deputados', url: proposicao.url, tipo: 'primaria' });
  });
});
