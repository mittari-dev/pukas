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
