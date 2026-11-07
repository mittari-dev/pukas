import { afterEach, expect, test, vi } from 'vitest';
import { conferirTurnstile } from './turnstile';

afterEach(() => vi.unstubAllEnvs());

const cloudflare = (sucesso: boolean) => {
  const chamadas: FormData[] = [];
  const f = (async (_url: string, init: RequestInit) => {
    chamadas.push(init.body as FormData);
    return new Response(JSON.stringify({ success: sucesso }));
  }) as unknown as typeof fetch;
  return { f, chamadas };
};

test('sem segredo ou sem token, recusa sem perguntar à Cloudflare', async () => {
  const { f, chamadas } = cloudflare(true);
  expect(await conferirTurnstile('tok', '1.1.1.1', f)).toBe(false);
  vi.stubEnv('TURNSTILE_SECRET', 's');
  expect(await conferirTurnstile('', '1.1.1.1', f)).toBe(false);
  expect(chamadas).toHaveLength(0);
});

test('manda segredo, token e IP, e respeita a resposta', async () => {
  vi.stubEnv('TURNSTILE_SECRET', 's');
  const ok = cloudflare(true);
  expect(await conferirTurnstile('tok', '1.1.1.1', ok.f)).toBe(true);
  expect(Object.fromEntries(ok.chamadas[0])).toEqual({ secret: 's', response: 'tok', remoteip: '1.1.1.1' });
  expect(await conferirTurnstile('tok', '1.1.1.1', cloudflare(false).f)).toBe(false);
});

test('Cloudflare fora do ar, recusa', async () => {
  vi.stubEnv('TURNSTILE_SECRET', 's');
  const caiu = (async () => {
    throw new TypeError('fetch failed');
  }) as unknown as typeof fetch;
  expect(await conferirTurnstile('tok', '1.1.1.1', caiu)).toBe(false);
});
