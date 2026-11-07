// Votações (spec consultas §4 e §5): o público nunca toca em `votos`; só a rota, com a chave de serviço, grava.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo, pecaValida } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let editor: SupabaseClient;
let revisor: SupabaseClient;
let redator: SupabaseClient;

beforeAll(async () => {
  [editor, revisor, redator] = await Promise.all([
    entrarComo('editor', { aal2: true }),
    entrarComo('revisor', { aal2: true }),
    entrarComo('redator', { aal2: true }),
  ]);
});

const comp = () => `PK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

async function votacao(extra: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await servico.from('pecas').insert({ ...pecaValida('votacao'), ...extra }).select('id').single();
  if (error) throw error;
  return data.id;
}

const voto = (votacao_id: string, extra: Record<string, unknown> = {}) => ({
  votacao_id,
  opcao: 'a_favor',
  comprovante: comp(),
  aparelho_hash: `ap-${Math.random()}`,
  ip_hash: 'rede-1',
  ...extra,
});

describe('votos', () => {
  test('anon não lê nem grava; redator não grava', async () => {
    const v = await votacao();
    await servico.from('votos').insert(voto(v));
    expect((await anon.from('votos').select('id')).data ?? []).toEqual([]);
    expect((await anon.from('votos').insert(voto(v))).error).not.toBeNull();
    expect((await redator.from('votos').insert(voto(v))).error).not.toBeNull();
  });

  test('chave de serviço grava em votação publicada; em rascunho, recusa', async () => {
    const v = await votacao();
    expect((await servico.from('votos').insert(voto(v))).error).toBeNull();
    const r = await votacao({ estado: 'rascunho' });
    const { error } = await servico.from('votos').insert(voto(r));
    expect(error?.code).toBe('P0001');
    expect(error?.message).toContain('votação fechada');
  });

  test('passou de fecha_em, recusa', async () => {
    const v = await votacao();
    await servico.from('pecas').update({ fecha_em: new Date(Date.now() - 60_000).toISOString() }).eq('id', v);
    expect((await servico.from('votos').insert(voto(v))).error?.message).toContain('votação fechada');
  });

  test('despublicar faz o voto seguinte ser recusado', async () => {
    const v = await votacao();
    expect((await servico.from('votos').insert(voto(v))).error).toBeNull();
    await servico.from('pecas').update({ estado: 'rascunho' }).eq('id', v);
    expect((await servico.from('votos').insert(voto(v))).error?.message).toContain('votação fechada');
  });

  test('comprovante repetido dá 23505', async () => {
    const v = await votacao();
    const c = comp();
    await servico.from('votos').insert(voto(v, { comprovante: c }));
    expect((await servico.from('votos').insert(voto(v, { comprovante: c }))).error?.code).toBe('23505');
  });
});

describe('funções públicas', () => {
  test('resultado conta só os válidos e agrupa os descartes', async () => {
    const v = await votacao();
    await servico.from('votos').insert([
      voto(v),
      voto(v),
      voto(v, { opcao: 'contra' }),
      voto(v, { descartado: true, motivo: 'muitos votos da mesma rede' }),
    ]);
    const { data, error } = await anon.rpc('resultado_votacao', { v });
    expect(error).toBeNull();
    expect(data[0]).toMatchObject({ a_favor: 2, contra: 1, nao_sei: 0, descartes: { 'muitos votos da mesma rede': 1 } });
  });

  test('comprovantes: só válidos, sem relato nem aparelho; em rascunho, vazio', async () => {
    const v = await votacao();
    const valido = comp();
    const descartado = comp();
    await servico.from('votos').insert([
      voto(v, { comprovante: valido, relato: 'segredo' }),
      voto(v, { comprovante: descartado, descartado: true, motivo: 'campo escondido preenchido' }),
    ]);
    const { data } = await anon.rpc('comprovantes_votacao', { v });
    expect(data.map((l: { comprovante: string }) => l.comprovante)).toEqual([valido]);
    expect(Object.keys(data[0]).sort()).toEqual(['comprovante', 'dia', 'opcao']);

    await servico.from('pecas').update({ estado: 'rascunho' }).eq('id', v);
    expect((await anon.rpc('comprovantes_votacao', { v })).data).toEqual([]);
  });

  test('apagar_relato: editor apaga, revisor não', async () => {
    const v = await votacao();
    const c = comp();
    await servico.from('votos').insert(voto(v, { comprovante: c, relato: 'meu relato', citar: true }));
    expect((await revisor.rpc('apagar_relato', { c })).data).toBe(false);
    expect((await editor.rpc('apagar_relato', { c })).data).toBe(true);
    const { data } = await servico.from('votos').select('relato, citar').eq('comprovante', c).single();
    expect(data).toEqual({ relato: null, citar: false });
  });
});

describe('trava de publicação da votação', () => {
  test('sem proposição, recusa', async () => {
    const { error } = await servico.from('pecas').insert({ ...pecaValida('votacao'), proposicao: null });
    expect(error?.message).toContain('sem proposição');
  });

  test('ao publicar, fecha_em fica a 30 dias', async () => {
    const id = await votacao({ estado: 'rascunho' });
    await servico.from('pecas').update({ estado: 'publicada' }).eq('id', id);
    const { data } = await servico.from('pecas').select('fecha_em').eq('id', id).single();
    const esperado = Date.now() + 30 * 864e5;
    expect(Math.abs(new Date(data!.fecha_em).getTime() - esperado)).toBeLessThan(60_000);
  });
});
