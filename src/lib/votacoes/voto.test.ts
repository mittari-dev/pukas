import { describe, expect, test } from 'vitest';
import { ehOpcao, gerarComprovante, hashSecreto, ipDaRequisicao, limparRelato, motivoDescarte, oQueMostrar, porcentagens } from './voto';

describe('comprovante', () => {
  test('PK- e 6 caracteres sem os que se confundem', () => {
    for (let i = 0; i < 50; i++) expect(gerarComprovante()).toMatch(/^PK-[2-9A-HJKMNP-TV-Z]{6}$/);
  });
  test('com gerador fixo, sempre o mesmo', () => {
    const fixo = (n: number) => new Uint8Array(n).fill(7);
    expect(gerarComprovante(fixo)).toBe(gerarComprovante(fixo));
  });
});

test('ehOpcao', () => {
  expect(ehOpcao('a_favor')).toBe(true);
  expect(ehOpcao('nao_sei')).toBe(true);
  expect(ehOpcao('talvez')).toBe(false);
});

test('hash é determinístico e muda com o segredo', async () => {
  expect(await hashSecreto('s', 'x')).toBe(await hashSecreto('s', 'x'));
  expect(await hashSecreto('s', 'x')).not.toBe(await hashSecreto('t', 'x'));
  expect(await hashSecreto('s', 'x')).toMatch(/^[0-9a-f]{64}$/);
});

describe('IP da requisição', () => {
  test('prefere o da Vercel', () => {
    expect(ipDaRequisicao(new Headers({ 'x-vercel-forwarded-for': '1.1.1.1', 'x-forwarded-for': '9.9.9.9, 1.1.1.1' }))).toBe('1.1.1.1');
  });
  test('depois o primeiro do x-forwarded-for', () => {
    expect(ipDaRequisicao(new Headers({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' }))).toBe('9.9.9.9');
  });
  test('depois o x-real-ip', () => {
    expect(ipDaRequisicao(new Headers({ 'x-real-ip': '5.5.5.5' }))).toBe('5.5.5.5');
  });
  test('sem cabeçalho, desconhecido', () => {
    expect(ipDaRequisicao(new Headers())).toBe('desconhecido');
  });
});

describe('descarte', () => {
  test('honeypot preenchido', () => {
    expect(motivoDescarte({ honeypot: 'x', validosDaRedeNaHora: 0, validosDaRedeNaVotacao: 0 })).toBe('campo escondido preenchido');
  });
  test('o 31º da mesma rede na hora', () => {
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 29, validosDaRedeNaVotacao: 29 })).toBeNull();
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 30, validosDaRedeNaVotacao: 30 })).toBe('muitos votos da mesma rede');
  });
  // Revisão de segurança 08/11: sem teto na votação inteira, 30 por hora davam ~21 mil por IP em 30 dias.
  test('o 101º da mesma rede na votação inteira, mesmo espalhado em horas diferentes', () => {
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 0, validosDaRedeNaVotacao: 99 })).toBeNull();
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 0, validosDaRedeNaVotacao: 100 })).toBe('muitos votos da mesma rede');
  });
});

describe('relato', () => {
  test('vazio vira null', () => expect(limparRelato('  ')).toEqual({ relato: null }));
  test('apara', () => expect(limparRelato(' oi ')).toEqual({ relato: 'oi' }));
  test('mais de 1.000 dá erro', () => expect(limparRelato('a'.repeat(1001)).erro).toBeTruthy());
  test('não-texto vira null', () => expect(limparRelato(undefined)).toEqual({ relato: null }));
});

test('o que mostrar', () => {
  expect(oQueMostrar({ votou: false, fechada: false })).toBe('so_total');
  expect(oQueMostrar({ votou: true, fechada: false })).toBe('parcial');
  expect(oQueMostrar({ votou: false, fechada: true })).toBe('final');
});

describe('porcentagens', () => {
  test('arredonda para inteiro, sem forçar a soma a 100', () => {
    expect(porcentagens({ a_favor: 1, contra: 1, nao_sei: 1 })).toEqual({ a_favor: 33, contra: 33, nao_sei: 33, total: 3 });
    expect(porcentagens({ a_favor: 2, contra: 1, nao_sei: 0 })).toEqual({ a_favor: 67, contra: 33, nao_sei: 0, total: 3 });
  });
  test('sem votos, tudo zero', () => {
    expect(porcentagens({ a_favor: 0, contra: 0, nao_sei: 0 })).toEqual({ a_favor: 0, contra: 0, nao_sei: 0, total: 0 });
  });
});
