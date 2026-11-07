import { describe, expect, test } from 'vitest';
import { ehOpcao, gerarComprovante, hashSecreto, ipDaRequisicao, limparRelato, motivoDescarte, oQueMostrar } from './voto';

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
    expect(motivoDescarte({ honeypot: 'x', validosDaRedeNaHora: 0 })).toBe('campo escondido preenchido');
  });
  test('o 31º da mesma rede na hora', () => {
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 29 })).toBeNull();
    expect(motivoDescarte({ honeypot: '', validosDaRedeNaHora: 30 })).toBe('muitos votos da mesma rede');
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
