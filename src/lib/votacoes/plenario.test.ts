import { describe, expect, test } from 'vitest';
import { planoDoDia, type VotacaoDoRobo } from './plenario';
import type { VotacaoNominal } from './congresso';

const agora = new Date('2026-12-01T10:00:00Z');
const dia = 864e5;
const proposicao = { casa: 'camara' as const, sigla: 'PEC', numero: 1, ano: 2026, id: '1', ementa: 'e', url: 'https://www.camara.leg.br/x' };
const votacao = (extra: Partial<VotacaoDoRobo> = {}): VotacaoDoRobo => ({
  id: 'v1',
  proposicao,
  publicada_em: new Date(agora.getTime() - 10 * dia).toISOString(),
  fecha_em: new Date(agora.getTime() + 20 * dia).toISOString(),
  gravadas: [],
  ...extra,
});
const nominal = (idOficial: string, diasAtras: number, descricao = 'Aprovada a PEC em primeiro turno.'): VotacaoNominal => ({
  idOficial,
  data: new Date(agora.getTime() - diasAtras * dia),
  descricao,
  sim: 1,
  nao: 0,
  abstencao: 0,
  outros: 0,
  votos: [{ nome: 'A', partido: 'P', uf: 'RJ', voto: 'Sim' }],
});

describe('planoDoDia', () => {
  test('nominal de antes da publicação não fecha nem grava', () => {
    expect(planoDoDia([votacao()], new Map([['v1', [nominal('n1', 15)]]]), agora)).toEqual({ gravar: [], fechar: [] });
  });
  test('nominal depois da publicação fecha e é gravada', () => {
    const n = nominal('n2', 2);
    expect(planoDoDia([votacao()], new Map([['v1', [n]]]), agora)).toEqual({ gravar: [{ votacaoId: 'v1', votacao: n }], fechar: ['v1'] });
  });
  test('com 31 dias e nenhuma nominal, fecha sem gravar', () => {
    const v = votacao({ publicada_em: new Date(agora.getTime() - 31 * dia).toISOString(), fecha_em: new Date(agora.getTime() - dia + 60_000).toISOString() });
    expect(planoDoDia([v], new Map([['v1', []]]), agora)).toEqual({ gravar: [], fechar: ['v1'] });
  });
  test('erro na casa (fora do mapa): nada muda', () => {
    const v = votacao({ fecha_em: new Date(agora.getTime() - 60_000).toISOString() });
    expect(planoDoDia([v], new Map(), agora)).toEqual({ gravar: [], fechar: [] });
  });
  test('já gravada não é gravada de novo; fechada há tempo só grava as novas', () => {
    const v = votacao({ fecha_em: new Date(agora.getTime() - 5 * dia).toISOString(), gravadas: ['n2'] });
    const nova = nominal('n3', 1);
    expect(planoDoDia([v], new Map([['v1', [nominal('n2', 6), nova]]]), agora)).toEqual({ gravar: [{ votacaoId: 'v1', votacao: nova }], fechar: [] });
  });
  test('requerimento votado em plenário é gravado, mas não fecha a votação', () => {
    const r = nominal('n4', 1, 'Aprovado o Requerimento de urgência.');
    expect(planoDoDia([votacao()], new Map([['v1', [r]]]), agora)).toEqual({ gravar: [{ votacaoId: 'v1', votacao: r }], fechar: [] });
  });
});
