// Login do painel de ponta a ponta, contra o site rodando (RETRATO_URL) e o banco local.
import { describe, expect, test } from 'vitest';
import { clienteServico } from '../banco/ajuda';
import { codigoTotp } from '../banco/totp';

const base = process.env.RETRATO_URL;

// Navegador mínimo: guarda cookies e manda Origin (o Astro recusa POST de outro site).
function navegador() {
  const cookies = new Map<string, string>();
  return async (caminho: string, corpo?: Record<string, string>) => {
    const r = await fetch(new URL(caminho, base), {
      method: corpo ? 'POST' : 'GET',
      redirect: 'manual',
      headers: {
        cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
        origin: new URL(base!).origin,
        ...(corpo ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: corpo ? new URLSearchParams(corpo) : undefined,
    });
    for (const c of r.headers.getSetCookie()) {
      const [par] = c.split(';');
      const i = par.indexOf('=');
      cookies.set(par.slice(0, i), par.slice(i + 1));
    }
    return r;
  };
}

describe.skipIf(!base)('painel', () => {
  test('sem login, /admin manda para entrar e não vai para o cache', async () => {
    const r = await navegador()('/admin');
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/admin/entrar?volta=%2Fadmin');
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('x-frame-options')).toBe('DENY');
  });

  test('senha certa sem 2FA não abre o painel; com o código abre', async () => {
    const email = `fundador-${Date.now()}@teste.pukas`;
    const senha = 'uma-senha-bem-comprida-123';
    const servico = clienteServico();
    const { data: criado } = await servico.auth.admin.createUser({ email, password: senha, email_confirm: true });
    await servico.from('perfis').insert({ id: criado.user!.id, nome: 'Fundador', papel: 'editor' });

    const ir = navegador();
    const errado = await ir('/admin/entrar', { email, senha: 'errada' });
    expect(await errado.text()).toContain('E-mail, senha ou código errados.');

    const entrou = await ir('/admin/entrar', { email, senha });
    expect(entrou.status).toBe(303);
    expect((await ir('/admin')).headers.get('location')).toBe('/admin/2fa?volta=%2Fadmin');

    const pagina = await (await ir('/admin/2fa')).text();
    const segredo = pagina.match(/<code[^>]*>([A-Z2-7]+)<\/code>/)?.[1];
    const fator = pagina.match(/name="fator" value="([^"]+)"/)?.[1];
    expect(segredo).toBeTruthy();
    const confirmou = await ir('/admin/2fa', { fator: fator!, codigo: codigoTotp(segredo!) });
    expect(confirmou.status).toBe(303);

    const painel = await ir('/admin');
    expect(painel.status).toBe(200);
    expect(await painel.text()).toContain('Fundador');
  });
});
