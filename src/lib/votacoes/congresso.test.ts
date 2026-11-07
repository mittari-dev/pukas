// Contra respostas reais gravadas das APIs abertas (PEC 45/2019, reforma tributária, votada nas duas casas).
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buscarProposicao, ErroCongresso, votacoesNominais } from './congresso';

const gravado = (arquivo: string) => readFileSync(new URL(`../../../tests/fixtures/congresso/${arquivo}`, import.meta.url), 'utf-8');
const resposta = (corpo: string, status = 200) => new Response(corpo, { status, headers: { 'content-type': 'application/json' } });

// O fetch falso escolhe o arquivo pelo endereço pedido.
const falso = (mapa: [RegExp, string][]): typeof fetch =>
  (async (url: string | URL) => {
    const u = String(url);
    const achado = mapa.find(([re]) => re.test(u));
    return resposta(achado ? gravado(achado[1]) : '{"dados":[]}');
  }) as typeof fetch;

const camara = falso([
  [/proposicoes\?siglaTipo=PEC&numero=45&ano=2019/, 'camara-busca-pec-45-2019.json'],
  [/proposicoes\?siglaTipo=PEC&numero=9999/, 'camara-busca-inexistente.json'],
  [/proposicoes\/2196833\/votacoes/, 'camara-votacoes-2196833.json'],
  [/votacoes\/2196833-373\/votos/, 'camara-votos-2196833-373.json'],
]);
const senado = falso([
  [/processo\?sigla=PEC&numero=45&ano=2019/, 'senado-busca-pec-45-2019.json'],
  [/processo\?sigla=PEC&numero=9999/, 'senado-busca-inexistente.json'],
  [/votacao\?codigoMateria=158930/, 'senado-votacoes-158930.json'],
]);
const quebrado = (async () => resposta('erro', 500)) as unknown as typeof fetch;
const semRede = (async () => {
  throw new TypeError('fetch failed');
}) as unknown as typeof fetch;

describe('Câmara', () => {
  test('busca a proposição', async () => {
    const p = await buscarProposicao('camara', 'PEC', 45, 2019, camara);
    expect(p).toMatchObject({ casa: 'camara', sigla: 'PEC', numero: 45, ano: 2019, id: '2196833' });
    expect(p!.ementa).toContain('Sistema Tributário');
    expect(p!.url).toBe('https://www.camara.leg.br/propostas-legislativas/2196833');
  });
  test('proposição que não existe dá null', async () => {
    expect(await buscarProposicao('camara', 'PEC', 9999, 2019, camara)).toBeNull();
  });
  test('API fora do ar lança ErroCongresso', async () => {
    await expect(buscarProposicao('camara', 'PEC', 45, 2019, quebrado)).rejects.toBeInstanceOf(ErroCongresso);
    await expect(buscarProposicao('camara', 'PEC', 45, 2019, semRede)).rejects.toBeInstanceOf(ErroCongresso);
  });
  test('votações nominais do plenário, com placar igual à lista', async () => {
    const p = (await buscarProposicao('camara', 'PEC', 45, 2019, camara))!;
    const vs = await votacoesNominais(p, new Date('2019-01-01'), camara);
    expect(vs.length).toBeGreaterThanOrEqual(1);
    const v = vs.find((x) => x.idOficial === '2196833-373')!;
    expect(v).toMatchObject({ sim: 375, nao: 113, abstencao: 3, outros: 0 });
    expect(v.sim + v.nao + v.abstencao + v.outros).toBe(v.votos.length);
    expect(v.votos[0]).toEqual({ nome: 'Diego Garcia', partido: 'REPUBLICANOS', uf: 'PR', voto: 'Sim' });
  });
  test('nada antes de "desde"', async () => {
    const p = (await buscarProposicao('camara', 'PEC', 45, 2019, camara))!;
    expect(await votacoesNominais(p, new Date('2024-01-01'), camara)).toEqual([]);
  });
});

describe('Senado', () => {
  test('busca a proposição', async () => {
    const p = await buscarProposicao('senado', 'PEC', 45, 2019, senado);
    expect(p).toMatchObject({ casa: 'senado', sigla: 'PEC', numero: 45, ano: 2019, id: '158930' });
    expect(p!.ementa).toContain('Sistema Tributário');
    expect(p!.url).toBe('https://www25.senado.leg.br/web/atividade/materias/-/materia/158930');
  });
  test('proposição que não existe dá null', async () => {
    expect(await buscarProposicao('senado', 'PEC', 9999, 2019, senado)).toBeNull();
  });
  test('API fora do ar lança ErroCongresso', async () => {
    await expect(buscarProposicao('senado', 'PEC', 45, 2019, quebrado)).rejects.toBeInstanceOf(ErroCongresso);
  });
  test('votações nominais do plenário, da mais antiga para a mais nova', async () => {
    const p = (await buscarProposicao('senado', 'PEC', 45, 2019, senado))!;
    const vs = await votacoesNominais(p, new Date('2019-01-01'), senado);
    expect(vs.map((v) => v.idOficial)).toEqual(['6773', '6774', '6775', '6776', '6777']);
    const final = vs[4];
    expect(final).toMatchObject({ sim: 53, nao: 24, abstencao: 0, outros: 4 });
    expect(final.sim + final.nao + final.abstencao + final.outros).toBe(final.votos.length);
    expect(final.votos[0]).toMatchObject({ partido: expect.any(String), uf: expect.stringMatching(/^[A-Z]{2}$/) });
  });
});
