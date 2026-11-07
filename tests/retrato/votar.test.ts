// Rota /api/votar de ponta a ponta, contra o site rodando (RETRATO_URL), o banco local e as chaves de teste do Turnstile.
import { describe, expect, test } from 'vitest';
import { clienteAnonimo, clienteServico, pecaValida } from '../banco/ajuda';
import { hashSecreto } from '../../src/lib/votacoes/voto';

const base = process.env.RETRATO_URL;
const servico = clienteServico();
const anon = clienteAnonimo();
// A chave secreta de teste da Cloudflare aceita qualquer token não vazio.
const TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

function navegador(extra: Record<string, string> = {}) {
  const cookies = new Map<string, string>();
  return {
    cookies,
    async votar(campos: Record<string, string>) {
      const r = await fetch(new URL('/api/votar', base), {
        method: 'POST',
        redirect: 'manual',
        headers: {
          cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
          origin: new URL(base!).origin,
          'content-type': 'application/x-www-form-urlencoded',
          ...extra,
        },
        body: new URLSearchParams(campos),
      });
      for (const c of r.headers.getSetCookie()) {
        const [par] = c.split(';');
        const i = par.indexOf('=');
        cookies.set(par.slice(0, i), par.slice(i + 1));
      }
      return r;
    },
  };
}

async function votacao(extra: Record<string, unknown> = {}) {
  const linha = { ...pecaValida('votacao'), ...extra };
  const { data, error } = await servico.from('pecas').insert(linha).select('id, slug').single();
  if (error) throw error;
  return data as { id: string; slug: string };
}

const comprovantes = async (v: string) => ((await anon.rpc('comprovantes_votacao', { v })).data ?? []) as unknown[];

describe.skipIf(!base)('/api/votar', () => {
  test('sem token do anti-robô, recusa e não grava', async () => {
    const v = await votacao();
    const n = navegador();
    const r = await n.votar({ votacao: v.slug, opcao: 'contra' });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe(`/votacoes/${v.slug}`);
    expect(n.cookies.get('pk_voto')).toBe('robo');
    expect(await comprovantes(v.id)).toHaveLength(0);
  });

  test('com o anti-robô, grava; o mesmo aparelho de novo volta "ja"', async () => {
    const v = await votacao();
    const n = navegador();
    await n.votar({ votacao: v.slug, opcao: 'contra', 'cf-turnstile-response': TOKEN });
    expect(n.cookies.get('pk_voto')).toBe('ok');
    expect(n.cookies.get('pk_aparelho')).toMatch(/^[0-9a-f]{64}$/);
    expect(await comprovantes(v.id)).toHaveLength(1);

    await n.votar({ votacao: v.slug, opcao: 'a_favor', 'cf-turnstile-response': TOKEN });
    expect(n.cookies.get('pk_voto')).toBe('ja');
    expect(await comprovantes(v.id)).toHaveLength(1);
  });

  test('honeypot preenchido responde normal e grava como descartado', async () => {
    const v = await votacao();
    const n = navegador();
    await n.votar({ votacao: v.slug, opcao: 'a_favor', site: 'x', 'cf-turnstile-response': TOKEN });
    expect(n.cookies.get('pk_voto')).toBe('ok');
    const { data } = await servico.from('votos').select('descartado, motivo').eq('votacao_id', v.id);
    expect(data).toEqual([{ descartado: true, motivo: 'campo escondido preenchido' }]);
  });

  test('o 31º voto válido da mesma rede na hora entra descartado', async () => {
    const v = await votacao();
    const ipHash = await hashSecreto(process.env.VOTO_SEGREDO!, '7.7.7.7');
    const trinta = Array.from({ length: 30 }, (_, i) => ({
      votacao_id: v.id,
      opcao: 'a_favor',
      comprovante: `PK-R${i}${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      aparelho_hash: `rede-${i}-${Math.random()}`,
      ip_hash: ipHash,
    }));
    expect((await servico.from('votos').insert(trinta)).error).toBeNull();
    const n = navegador({ 'x-forwarded-for': '7.7.7.7' });
    await n.votar({ votacao: v.slug, opcao: 'contra', 'cf-turnstile-response': TOKEN });
    expect(n.cookies.get('pk_voto')).toBe('ok');
    const { data } = await servico.from('votos').select('motivo').eq('votacao_id', v.id).eq('descartado', true);
    expect(data).toEqual([{ motivo: 'muitos votos da mesma rede' }]);
  });

  test('votação fechada volta "fechada"; em espanhol, volta para /es', async () => {
    const v = await votacao();
    await servico.from('pecas').update({ fecha_em: new Date(Date.now() - 60_000).toISOString() }).eq('id', v.id);
    const n = navegador({ referer: `${base}/es/votacoes/${v.slug}` });
    const r = await n.votar({ votacao: v.slug, opcao: 'contra', 'cf-turnstile-response': TOKEN });
    expect(r.headers.get('location')).toBe(`/es/votacoes/${v.slug}`);
    expect(n.cookies.get('pk_voto')).toBe('fechada');
  });

  test('opção inválida volta "erro"', async () => {
    const v = await votacao();
    const n = navegador();
    await n.votar({ votacao: v.slug, opcao: 'talvez', 'cf-turnstile-response': TOKEN });
    expect(n.cookies.get('pk_voto')).toBe('erro');
  });
});
