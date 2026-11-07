// Séries da newsletter: o site lê as ligadas; só o editor com 2FA cria e edita; o endereço não muda.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo, pecaValida } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let editor: SupabaseClient;
let editorSem2fa: SupabaseClient;
let revisor: SupabaseClient;

beforeAll(async () => {
  [editor, editorSem2fa, revisor] = await Promise.all([
    entrarComo('editor', { aal2: true }),
    entrarComo('editor', { aal2: false }),
    entrarComo('revisor', { aal2: true }),
  ]);
});

// Sufixo: o banco de teste pode rodar a suíte mais de uma vez sem reset.
const fim = Date.now().toString(36);
const serie = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug: slug.includes(' ') ? slug : `${slug}-${fim}`, nome: 'Fronteira Sul', nome_es: 'Frontera Sur', selo: 'FRONTEIRA SUL*', selo_es: 'FRONTERA SUR*', ...extra,
});

describe('séries', () => {
  test('começa com a Memória Operária, que o site lê', async () => {
    const { data } = await anon.from('series').select('slug, nome, ativa');
    expect(data).toContainEqual({ slug: 'memoria-operaria', nome: 'Memória Operária', ativa: true });
  });

  test('editor cria; revisor e editor sem 2FA não', async () => {
    expect((await revisor.from('series').insert(serie('do-revisor'))).error).not.toBeNull();
    expect((await editorSem2fa.from('series').insert(serie('sem-2fa'))).error).not.toBeNull();
    expect((await editor.from('series').insert(serie('fronteira-sul'))).error).toBeNull();
  });

  test('série desligada some do site, mas a equipe ainda vê', async () => {
    await servico.from('series').insert(serie('desligada', { ativa: false }));
    expect((await anon.from('series').select('slug').eq('slug', `desligada-${fim}`)).data).toEqual([]);
    expect((await revisor.from('series').select('slug').eq('slug', `desligada-${fim}`)).data).toHaveLength(1);
  });

  test('o endereço não muda e endereço fora do padrão é recusado', async () => {
    await servico.from('series').insert(serie('fixa'));
    const r = await editor.from('series').update({ slug: `outra-${fim}` }).eq('slug', `fixa-${fim}`);
    expect(r.error?.code).toBe('P0001');
    expect((await editor.from('series').insert(serie('Com Espaço'))).error).not.toBeNull();
    expect((await editor.from('series').update({ nome: 'Fixa nova' }).eq('slug', `fixa-${fim}`)).error).toBeNull();
  });

  test('peça de série que não existe é recusada', async () => {
    const r = await servico.from('pecas').insert({ ...pecaValida('newsletter'), estado: 'rascunho', serie: 'nao-existe' });
    expect(r.error?.code).toBe('23503');
  });
});
