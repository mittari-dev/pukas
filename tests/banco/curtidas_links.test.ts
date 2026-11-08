// Curtidas: o público não lê nem grava direto (só a rota, com a chave de serviço); a equipe vê o número.
// Links curtos: a equipe cria; só caminho do próprio site; o clique conta pela função.
import { beforeAll, describe, expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clienteAnonimo, clienteServico, entrarComo, pecaValida } from './ajuda';

const servico = clienteServico();
const anon = clienteAnonimo();
let redator: SupabaseClient;

beforeAll(async () => {
  redator = await entrarComo('redator', { aal2: true });
});

describe('curtidas', () => {
  test('uma por aparelho; número só para a equipe', async () => {
    const { data: p } = await servico.from('pecas').insert(pecaValida('cultura')).select('id').single();
    await servico.from('curtidas').insert([{ peca_id: p!.id, aparelho_hash: 'a' }, { peca_id: p!.id, aparelho_hash: 'b' }]);
    expect((await servico.from('curtidas').insert({ peca_id: p!.id, aparelho_hash: 'a' })).error?.code).toBe('23505');
    expect((await redator.rpc('curtidas_da_peca', { p: p!.id })).data).toBe(2);
    expect((await anon.rpc('curtidas_da_peca', { p: p!.id })).error).not.toBeNull();
    expect((await anon.from('curtidas').insert({ peca_id: p!.id, aparelho_hash: 'c' })).error).not.toBeNull();
  });
});

describe('links curtos', () => {
  test('equipe cria; destino de fora é barrado; anônimo não lê nem segue', async () => {
    const codigo = `t-${Date.now().toString(36)}`;
    expect((await redator.from('links_curtos').insert({ codigo, destino: '/votacoes' })).error).toBeNull();
    for (const destino of ['https://golpe.com', '//golpe.com', '/\\golpe.com']) {
      expect((await redator.from('links_curtos').insert({ codigo: `${codigo}-x`, destino })).error, destino).not.toBeNull();
    }
    expect((await anon.from('links_curtos').select('codigo')).data).toEqual([]);
    expect((await anon.rpc('seguir_link', { c: codigo })).error).not.toBeNull();
    expect((await servico.rpc('seguir_link', { c: codigo })).data).toBe('/votacoes');
    expect((await servico.from('links_curtos').select('cliques').eq('codigo', codigo).single()).data!.cliques).toBe(1);
  });
});
