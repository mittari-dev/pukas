import { describe, expect, test } from 'vitest';
import { enviarLote, type Mensagem } from './resend';

const msg = (i: number): Mensagem => ({ para: `p${i}@x.com`, assunto: 'a', html: '<p>h</p>', text: 't', sair: `https://pukas.lat/newsletter/sair?t=${i}` });

describe('enviarLote', () => {
  test('manda de 100 em 100, com remetente, sair em um clique e responder-para', async () => {
    const chamadas: { url: string; corpo: Record<string, unknown>[]; auth: string }[] = [];
    const f = (async (url: string, init: RequestInit) => {
      chamadas.push({ url, corpo: JSON.parse(String(init.body)), auth: new Headers(init.headers).get('authorization') ?? '' });
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    const r = await enviarLote('chave', Array.from({ length: 150 }, (_, i) => msg(i)), { responderPara: 'contato@x.com' }, f);
    expect(r).toEqual({ enviados: 150, falhas: 0 });
    expect(chamadas.map((c) => c.corpo.length)).toEqual([100, 50]);
    expect(chamadas[0].url).toBe('https://api.resend.com/emails/batch');
    expect(chamadas[0].auth).toBe('Bearer chave');
    expect(chamadas[0].corpo[0]).toMatchObject({
      from: 'PUKAS <newsletter@pukas.lat>',
      to: ['p0@x.com'],
      reply_to: 'contato@x.com',
      headers: { 'List-Unsubscribe': '<https://pukas.lat/newsletter/sair?t=0>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
  });

  test('lote recusado conta como falha e os outros seguem', async () => {
    let n = 0;
    const f = (async () => new Response('{}', { status: n++ === 0 ? 422 : 200 })) as unknown as typeof fetch;
    expect(await enviarLote('chave', Array.from({ length: 120 }, (_, i) => msg(i)), {}, f)).toEqual({ enviados: 20, falhas: 100 });
  });

  test('sem responder-para, o campo não vai', async () => {
    let corpo: Record<string, unknown>[] = [];
    const f = (async (_: string, init: RequestInit) => ((corpo = JSON.parse(String(init.body))), new Response('{}'))) as unknown as typeof fetch;
    await enviarLote('chave', [msg(1)], {}, f);
    expect(corpo[0]).not.toHaveProperty('reply_to');
  });
});
