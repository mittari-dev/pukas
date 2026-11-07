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

async function criarFundador() {
  const email = `fundador-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@teste.pukas`;
  const senha = 'uma-senha-bem-comprida-123';
  const servico = clienteServico();
  const { data: criado } = await servico.auth.admin.createUser({ email, password: senha, email_confirm: true });
  await servico.from('perfis').insert({ id: criado.user!.id, nome: 'Fundador', papel: 'editor' });
  return { ir: navegador(), email, senha };
}

// Já logado com senha: cadastra o TOTP lendo o segredo da página e confirma com o código.
async function confirmar2fa(ir: ReturnType<typeof navegador>) {
  const pagina = await (await ir('/admin/2fa')).text();
  const segredo = pagina.match(/<code[^>]*>([A-Z2-7]+)<\/code>/)?.[1];
  const fator = pagina.match(/name="fator" value="([^"]+)"/)?.[1];
  expect(segredo).toBeTruthy();
  expect((await ir('/admin/2fa', { fator: fator!, codigo: codigoTotp(segredo!) })).status).toBe(303);
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
    const { ir, email, senha } = await criarFundador();
    const errado = await navegador()('/admin/entrar', { email, senha: 'errada' });
    expect(await errado.text()).toContain('E-mail, senha ou código errados.');

    expect((await ir('/admin/entrar', { email, senha })).status).toBe(303);
    expect((await ir('/admin')).headers.get('location')).toBe('/admin/2fa?volta=%2Fadmin');
    await confirmar2fa(ir);

    const painel = await ir('/admin');
    expect(painel.status).toBe(200);
    expect(await painel.text()).toContain('Fundador');
  });

  test('publicar uma notícia pelo painel põe no site; corrigir mostra a correção', async () => {
    const { ir, email, senha } = await criarFundador();
    await ir('/admin/entrar', { email, senha });
    await confirmar2fa(ir);

    const slug = `greve-teste-${Date.now()}`;
    const campos = {
      slug, titulo: 'Greve | parou | o porto.', resumo: 'Resumo.', corpo: 'Os estivadores pararam por 3 dias.',
      checagem_por: 'Fundador', checagem_em: '2026-11-06',
      'fonte[0][titulo]': 'Nota do sindicato', 'fonte[0][instituicao]': 'Sindicato', 'fonte[0][url]': 'https://exemplo.org/nota', 'fonte[0][tipo]': 'primaria', 'fonte[0][acessadaEm]': '2026-11-06',
    };
    const publicou = await ir('/admin/peca/nova?tipo=noticia', { ...campos, acao: 'publicar' });
    expect(publicou.status).toBe(303);
    const id = publicou.headers.get('location')!.match(/\/admin\/peca\/([^?]+)/)![1];

    const noSite = await fetch(new URL(`/noticias/${slug}`, base));
    expect(noSite.status).toBe(200);
    expect(await noSite.text()).toContain('Os estivadores pararam por 3 dias.');

    const semDizer = await ir(`/admin/peca/${id}`, { ...campos, corpo: 'Os estivadores pararam por 4 dias.', acao: 'salvar' });
    expect(await semDizer.text()).toContain('diga se esta mudança é uma correção');

    const corrigiu = await ir(`/admin/peca/${id}`, { ...campos, corpo: 'Os estivadores pararam por 4 dias.', acao: 'salvar', e_correcao: 'sim', correcao_texto: 'Eram 4 dias, não 3.' });
    expect(corrigiu.status).toBe(303);
    const depois = await (await fetch(new URL(`/noticias/${slug}`, base))).text();
    expect(depois).toContain('Os estivadores pararam por 4 dias.');
    expect(depois).toContain('Eram 4 dias, não 3.');
  });
});
