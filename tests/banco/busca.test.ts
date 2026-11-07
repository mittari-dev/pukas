// Busca (spec busca §6): a equipe lê; editor e revisor escolhem; só o editor configura e pede rodada.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let editor: SupabaseClient;
let revisor: SupabaseClient;
let redator: SupabaseClient;
let candidataId: string;

beforeAll(async () => {
  [editor, revisor, redator] = await Promise.all([entrarComo('editor', { aal2: true }), entrarComo('revisor', { aal2: true }), entrarComo('redator', { aal2: true })]);
  const { data: rodada } = await servico.from('busca_rodadas').insert({ estado: 'pronta' }).select('id').single();
  const { data: c } = await servico
    .from('busca_candidatas')
    .insert({ rodada_id: rodada!.id, titulo: 'Greve no porto', porque: 'Afeta salário de estivadores.', regiao: 'brasil', tema: 'trabalho', fontes: [{ veiculo: 'Agência Brasil', titulo: 'Greve', url: 'https://agenciabrasil.ebc.com.br/x', fixa: true }] })
    .select('id')
    .single();
  candidataId = c!.id;
});

describe('leitura', () => {
  test('anon não lê; o redator lê a pauta', async () => {
    expect((await anon.from('busca_candidatas').select('id')).data ?? []).toEqual([]);
    expect((await redator.from('busca_candidatas').select('id').eq('id', candidataId)).data).toHaveLength(1);
  });

  test('semente: configuração segunda, quarta e sexta às 7h e 19 fontes', async () => {
    const { data: cfg } = await editor.from('busca_config').select('dias, hora, busca_livre, teto_brl').single();
    expect(cfg).toMatchObject({ dias: [1, 3, 5], hora: 7, busca_livre: true });
    expect(Number(cfg!.teto_brl)).toBe(50);
    expect((await editor.from('busca_fontes').select('id')).data).toHaveLength(19);
  });
});

describe('rodada', () => {
  test('só o editor pede, e só na fila em nome dele', async () => {
    expect((await revisor.from('busca_rodadas').insert({ estado: 'na_fila' })).error).not.toBeNull();
    const { data: eu } = await editor.auth.getUser();
    expect((await editor.from('busca_rodadas').insert({ estado: 'na_fila', pedida_por: eu.user!.id })).error).toBeNull();
    expect((await editor.from('busca_rodadas').insert({ estado: 'pronta', pedida_por: eu.user!.id })).error).not.toBeNull();
  });
});

describe('escolha', () => {
  test('revisor marca como pedida; não troca o título; redator não marca', async () => {
    expect((await revisor.from('busca_candidatas').update({ estado: 'pedida' }).eq('id', candidataId)).error).toBeNull();
    expect((await servico.from('busca_candidatas').select('estado').eq('id', candidataId).single()).data!.estado).toBe('pedida');
    expect((await revisor.from('busca_candidatas').update({ titulo: 'Outro' }).eq('id', candidataId)).error).not.toBeNull();
    await redator.from('busca_candidatas').update({ estado: 'descartada' }).eq('id', candidataId);
    expect((await servico.from('busca_candidatas').select('estado').eq('id', candidataId).single()).data!.estado).toBe('pedida');
  });
});

describe('configuração', () => {
  test('só o editor muda o teto e as fontes', async () => {
    await revisor.from('busca_config').update({ teto_brl: 999 }).eq('id', true);
    expect(Number((await servico.from('busca_config').select('teto_brl').single()).data!.teto_brl)).toBe(50);
    expect((await editor.from('busca_config').update({ teto_brl: 45 }).eq('id', true)).error).toBeNull();
    expect(Number((await servico.from('busca_config').select('teto_brl').single()).data!.teto_brl)).toBe(45);
    await servico.from('busca_config').update({ teto_brl: 50 }).eq('id', true);
  });
});
