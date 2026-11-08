// Páginas públicas das votações, contra o site rodando (RETRATO_URL) e o banco local.
import { describe, expect, test } from 'vitest';
import { clienteServico, pecaValida } from '../banco/ajuda';

const base = process.env.RETRATO_URL;
const servico = clienteServico();
const TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

async function votacao() {
  const { data, error } = await servico.from('pecas').insert(pecaValida('votacao')).select('id, slug').single();
  if (error) throw error;
  return data as { id: string; slug: string };
}

describe.skipIf(!base)('páginas das votações', () => {
  test('/votacoes: 200, no menu e fora do cache da borda', async () => {
    for (const caminho of ['/votacoes', '/es/votacoes']) {
      const r = await fetch(new URL(caminho, base), { redirect: 'manual' });
      expect(r.status, caminho).toBe(200);
      expect(r.headers.get('vercel-cdn-cache-control'), caminho).toBeNull();
    }
    expect(await (await fetch(new URL('/', base))).text()).toContain('>Votações<');
  });

  test('a votação mostra a ementa e a metodologia; quem não votou vê só o total', async () => {
    const v = await votacao();
    const html = await (await fetch(new URL(`/votacoes/${v.slug}`, base))).text();
    expect(html).toContain('Altera o Sistema Tributário Nacional.');
    expect(html).toContain('Resultado de quem votou no PUKAS');
    expect(html).toContain('data-visao="so_total"');
    expect(html).toContain('0 pessoas já votaram');
    expect(html).toContain('challenges.cloudflare.com/turnstile');
    expect(html).toContain('name="site"');
  });

  test('depois de votar, o aparelho vê o comprovante e a parcial', async () => {
    const v = await votacao();
    const r = await fetch(new URL('/api/votar', base), {
      method: 'POST',
      redirect: 'manual',
      headers: { origin: new URL(base!).origin, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ votacao: v.slug, opcao: 'contra', 'cf-turnstile-response': TOKEN }),
    });
    const cookie = r.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    const html = await (await fetch(new URL(`/votacoes/${v.slug}`, base), { headers: { cookie } })).text();
    expect(html).toContain('data-visao="parcial"');
    expect(html).toMatch(/#PK-[2-9A-HJKMNP-TV-Z]{6}/);
    expect(html).toContain('Seu comprovante');
  });

  test('votação que não existe dá 404', async () => {
    expect((await fetch(new URL('/votacoes/nao-existe', base))).status).toBe(404);
  });

  test('a lista mostra a votação aberta', async () => {
    const v = await votacao();
    const html = await (await fetch(new URL('/votacoes', base))).text();
    expect(html).toContain(`/votacoes/${v.slug}`);
  });
});
