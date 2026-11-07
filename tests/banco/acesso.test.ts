// Quem lê e quem grava (spec painel §4 e §5). Escrita sempre exige 2FA (aal2).
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

const criar = async (linha: Record<string, unknown>) => (await servico.from('pecas').insert(linha).select().single()).data;

describe('leitura pública', () => {
  test('anon lê só publicadas', async () => {
    const ids = await Promise.all(
      (['rascunho', 'em_revisao', 'rejeitada', 'publicada'] as const).map(async (estado) => (await criar({ ...pecaValida('pagina'), estado })).id),
    );
    const { data } = await anon.from('pecas').select('id, estado').in('id', ids);
    expect(data?.map((p) => p.estado)).toEqual(['publicada']);
  });

  test('anon não grava nada', async () => {
    const { error } = await anon.from('pecas').insert({ ...pecaValida('pagina'), estado: 'rascunho' });
    expect(error).not.toBeNull();
  });

  test('anon lê traduções e correções só de publicadas', async () => {
    const publicada = await criar(pecaValida('pagina'));
    const rascunho = await criar({ ...pecaValida('pagina'), estado: 'rascunho' });
    await servico.from('traducoes').insert([{ peca_id: publicada.id, estado: 'pronta', titulo: 'T' }, { peca_id: rascunho.id, estado: 'pronta', titulo: 'T' }]);
    await servico.from('correcoes').insert([{ peca_id: publicada.id, texto: 'c' }, { peca_id: rascunho.id, texto: 'c' }]);
    const ids = [publicada.id, rascunho.id];
    expect((await anon.from('traducoes').select('peca_id').in('peca_id', ids)).data).toEqual([{ peca_id: publicada.id }]);
    expect((await anon.from('correcoes').select('peca_id').in('peca_id', ids)).data).toEqual([{ peca_id: publicada.id }]);
  });
});

describe('escrita no painel', () => {
  test('editor sem 2FA (aal1) não grava', async () => {
    const { error } = await editorSem2fa.from('pecas').insert({ ...pecaValida('pagina'), estado: 'rascunho' });
    expect(error).not.toBeNull();
  });

  test('editor com 2FA publica', async () => {
    const { data, error } = await editor.from('pecas').insert({ ...pecaValida('pagina'), estado: 'rascunho' }).select().single();
    expect(error).toBeNull();
    const { error: erroPublicar } = await editor.from('pecas').update({ estado: 'publicada' }).eq('id', data.id);
    expect(erroPublicar).toBeNull();
  });

  test('redator cria rascunho mas não publica', async () => {
    const { data, error } = await redator.from('pecas').insert({ ...pecaValida('pagina'), estado: 'rascunho' }).select().single();
    expect(error).toBeNull();
    await redator.from('pecas').update({ estado: 'publicada' }).eq('id', data.id);
    expect((await servico.from('pecas').select('estado').eq('id', data.id).single()).data?.estado).toBe('rascunho');
    expect((await redator.from('pecas').insert(pecaValida('pagina'))).error).not.toBeNull();
  });

  test('revisor rejeita mas não publica', async () => {
    const p = await criar({ ...pecaValida('pagina'), estado: 'em_revisao' });
    await revisor.from('pecas').update({ estado: 'publicada' }).eq('id', p.id);
    expect((await servico.from('pecas').select('estado').eq('id', p.id).single()).data?.estado).toBe('em_revisao');
    await revisor.from('pecas').update({ estado: 'rejeitada' }).eq('id', p.id);
    expect((await servico.from('pecas').select('estado').eq('id', p.id).single()).data?.estado).toBe('rejeitada');
  });

  test('só o editor mexe em peça publicada', async () => {
    const p = await criar({ ...pecaValida('pagina'), titulo: 'No ar' });
    await revisor.from('pecas').update({ titulo: 'Mexido' }).eq('id', p.id);
    expect((await servico.from('pecas').select('titulo').eq('id', p.id).single()).data?.titulo).toBe('No ar');
  });

  test('ninguém altera nem apaga histórico', async () => {
    const p = await criar({ ...pecaValida('pagina'), estado: 'rascunho' });
    await servico.from('pecas').update({ titulo: 'Novo' }).eq('id', p.id);
    await editor.from('historico').update({ acao: 'publicar' }).eq('peca_id', p.id);
    await editor.from('historico').delete().eq('peca_id', p.id);
    expect((await servico.from('historico').select('acao').eq('peca_id', p.id)).data).toEqual([{ acao: 'salvar' }]);
    expect((await servico.from('historico').delete().eq('peca_id', p.id)).error).not.toBeNull();
  });
});

describe('fotos', () => {
  const arquivo = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' });

  test('só editor com 2FA envia para o bucket fotos', async () => {
    expect((await editor.storage.from('fotos').upload(`t-${Date.now()}.jpg`, arquivo())).error).toBeNull();
    expect((await editorSem2fa.storage.from('fotos').upload(`u-${Date.now()}.jpg`, arquivo())).error).not.toBeNull();
    expect((await redator.storage.from('fotos').upload(`r-${Date.now()}.jpg`, arquivo())).error).not.toBeNull();
  });

  test('bucket arquivos não é público e fotos é', async () => {
    expect((await servico.storage.getBucket('arquivos')).data?.public).toBe(false);
    expect((await servico.storage.getBucket('fotos')).data?.public).toBe(true);
  });
});

describe('dados plantados pelo redator', () => {
  test('publicada_em e atualizado_por do rascunho não sobrevivem à publicação', async () => {
    const { data: falso } = await servico.auth.admin.createUser({ email: `falso-${Date.now()}@teste.pukas`, password: 'senha-qualquer-123', email_confirm: true });
    const { data: peca, error } = await redator
      .from('pecas')
      .insert({ ...pecaValida('pagina'), estado: 'rascunho', publicada_em: '2020-01-01T00:00:00Z', atualizado_por: falso.user!.id })
      .select('id, atualizado_por')
      .single();
    expect(error).toBeNull();
    const { data: eu } = await editor.auth.getUser();
    const { error: erroPub } = await editor.from('pecas').update({ estado: 'publicada' }).eq('id', peca!.id);
    expect(erroPub).toBeNull();
    const { data: depois } = await servico.from('pecas').select('publicada_em, atualizado_por').eq('id', peca!.id).single();
    expect(new Date(depois!.publicada_em).getFullYear()).toBeGreaterThanOrEqual(2026);
    expect(depois!.atualizado_por).toBe(eu.user!.id);
  });
});
