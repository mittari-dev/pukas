// Newsletter por e-mail: e-mails só com a chave de serviço; a equipe vê números pela função do painel.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let editor: SupabaseClient;
let semDoisFatores: SupabaseClient;

beforeAll(async () => {
  [editor, semDoisFatores] = await Promise.all([entrarComo('editor', { aal2: true }), entrarComo('revisor', { aal2: false })]);
});

describe('assinantes', () => {
  test('serviço grava com token sorteado; e-mail repetido (maiúscula ou não) é barrado', async () => {
    const email = `teste-${crypto.randomUUID()}@x.com`;
    const { data, error } = await servico.from('assinantes').insert({ email, idioma: 'pt' }).select('token').single();
    expect(error).toBeNull();
    expect(data!.token).toMatch(/^[0-9a-f]{64}$/);
    const repetido = await servico.from('assinantes').insert({ email: email.toUpperCase(), idioma: 'pt' });
    expect(repetido.error?.code).toBe('23505');
  });

  test('ninguém de fora nem da equipe lê ou grava e-mails', async () => {
    expect((await anon.from('assinantes').insert({ email: 'a@x.com', idioma: 'pt' })).error).not.toBeNull();
    expect((await anon.from('assinantes').select('email')).data).toEqual([]);
    expect((await editor.from('assinantes').select('email')).data).toEqual([]);
  });

  test('a equipe com 2FA vê os números; sem 2FA ou anônimo, nada', async () => {
    await servico.from('assinantes_eventos').insert({ tipo: 'entrou' });
    const { data } = await editor.rpc('painel_assinantes');
    expect(data[0].confirmados).toBeGreaterThanOrEqual(0);
    expect(data[0].entraram_30).toBeGreaterThanOrEqual(1);
    expect((await semDoisFatores.rpc('painel_assinantes')).data).toEqual([]);
    expect((await anon.rpc('painel_assinantes')).error).not.toBeNull();
  });
});

describe('assinatura por série', () => {
  test('o envio de uma série pega quem escolheu essa série e quem recebe todas; o painel conta por série', async () => {
    const u = crypto.randomUUID();
    const todas = `todas-${u}@x.com`;
    const so = `so-${u}@x.com`;
    const outra = `outra-${u}@x.com`;
    const agora = new Date().toISOString();
    const { error } = await servico.from('assinantes').insert([
      { email: todas, idioma: 'pt', confirmado_em: agora },
      { email: so, idioma: 'pt', confirmado_em: agora, series: ['memoria-operaria'] },
      { email: outra, idioma: 'pt', confirmado_em: agora, series: ['outra-serie'] },
    ]);
    expect(error).toBeNull();
    const { data } = await servico.from('assinantes').select('email').in('email', [todas, so, outra]).or('series.eq.{},series.cs.{memoria-operaria}');
    expect((data ?? []).map((a) => a.email).sort()).toEqual([so, todas].sort());
    const { data: porSerie } = await editor.rpc('painel_assinantes_por_serie');
    expect(Array.isArray(porSerie)).toBe(true);
    expect((await anon.rpc('painel_assinantes_por_serie')).error).not.toBeNull();
  });
});
