// Agenda e ritmo (spec agenda §5 e §6): a equipe lê e escreve com 2FA; só o editor mexe no ritmo.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo, pecaValida } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let editor: SupabaseClient;
let editorSem2fa: SupabaseClient;
let revisor: SupabaseClient;
let redator: SupabaseClient;

beforeAll(async () => {
  [editor, editorSem2fa, revisor, redator] = await Promise.all([
    entrarComo('editor', { aal2: true }),
    entrarComo('editor', { aal2: false }),
    entrarComo('revisor', { aal2: true }),
    entrarComo('redator', { aal2: true }),
  ]);
});

const item = (extra: Record<string, unknown> = {}) => ({ dia: '2026-11-09', tipo: 'noticia', titulo: 'Greve no porto', ...extra });

describe('agenda', () => {
  test('anon não lê nem grava', async () => {
    await servico.from('agenda').insert(item());
    expect((await anon.from('agenda').select('id')).data ?? []).toEqual([]);
    expect((await anon.from('agenda').insert(item())).error).not.toBeNull();
  });

  test('editor sem 2FA não cria', async () => {
    expect((await editorSem2fa.from('agenda').insert(item())).error).not.toBeNull();
  });

  test('redator cria e apaga o que criou, mas não o item de outra pessoa', async () => {
    const { data: meu, error } = await redator.from('agenda').insert(item()).select('id').single();
    expect(error).toBeNull();
    const { data: dele } = await revisor.from('agenda').insert(item({ titulo: 'Do revisor' })).select('id').single();

    await redator.from('agenda').delete().eq('id', dele!.id);
    expect((await servico.from('agenda').select('id').eq('id', dele!.id)).data).toHaveLength(1);
    await redator.from('agenda').delete().eq('id', meu!.id);
    expect((await servico.from('agenda').select('id').eq('id', meu!.id)).data).toHaveLength(0);
  });

  test('newsletter sem série e item do tipo página são recusados', async () => {
    expect((await editor.from('agenda').insert(item({ tipo: 'newsletter' }))).error).not.toBeNull();
    expect((await editor.from('agenda').insert(item({ tipo: 'pagina' }))).error).not.toBeNull();
  });

  test('uma peça não liga a dois itens; apagar a peça solta o item', async () => {
    const { data: peca } = await servico.from('pecas').insert({ ...pecaValida('noticia'), estado: 'rascunho' }).select('id').single();
    const { data: a } = await editor.from('agenda').insert(item({ peca_id: peca!.id })).select('id').single();
    const segundo = await editor.from('agenda').insert(item({ peca_id: peca!.id }));
    expect(segundo.error?.code).toBe('23505');

    await servico.from('pecas').delete().eq('id', peca!.id);
    const { data: depois } = await servico.from('agenda').select('peca_id').eq('id', a!.id).single();
    expect(depois!.peca_id).toBeNull();
  });
});

describe('equipe para o responsável', () => {
  test('com 2FA a equipe vê os colegas; sem 2FA, só o próprio perfil', async () => {
    const { data: todos } = await redator.from('perfis').select('id, nome, papel');
    expect(todos!.map((p) => p.papel)).toEqual(expect.arrayContaining(['editor', 'revisor', 'redator']));
    const { data: proprio } = await editorSem2fa.from('perfis').select('id');
    expect(proprio).toHaveLength(1);
  });
});

describe('ritmo', () => {
  test('começa com a Memória Operária às segundas', async () => {
    const { data } = await editor.from('ritmo').select('dia_semana, tipo, serie, ativo');
    expect(data).toContainEqual({ dia_semana: 1, tipo: 'newsletter', serie: 'memoria-operaria', ativo: true });
  });

  test('a equipe lê; só o editor grava', async () => {
    expect((await redator.from('ritmo').select('id')).data?.length).toBeGreaterThan(0);
    expect((await revisor.from('ritmo').insert({ dia_semana: 4, tipo: 'noticia' })).error).not.toBeNull();
    const { error } = await editor.from('ritmo').insert({ dia_semana: 4, tipo: 'noticia', rotulo: 'Investigação' });
    expect(error).toBeNull();
    expect((await anon.from('ritmo').select('id')).data ?? []).toEqual([]);
  });
});
