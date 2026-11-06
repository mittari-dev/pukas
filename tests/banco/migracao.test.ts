// A migração de src/content para o banco roda duas vezes sem duplicar nada (plano, Tarefa 4).
import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';
import { URL_LOCAL, chave, clienteAnonimo, clienteServico } from './ajuda';

const rodar = () =>
  execFileSync('node', ['scripts/migrar-para-banco.ts'], {
    env: { ...process.env, SUPABASE_URL: URL_LOCAL, SUPABASE_SERVICE_ROLE_KEY: chave('SERVICE_ROLE_KEY') },
    encoding: 'utf-8',
  });

test('migração é idempotente e publica só o manifesto', async () => {
  rodar();
  const db = clienteServico();
  const contar = async () => (await db.from('pecas').select('id', { count: 'exact', head: true }).in('slug', ['manifesto', 'modelo'])).count;
  const depoisDaPrimeira = await contar();
  rodar();
  expect(await contar()).toBe(depoisDaPrimeira);

  const { data: manifesto } = await clienteAnonimo().from('pecas').select('id, estado, corpo').eq('tipo', 'pagina').eq('slug', 'manifesto').single();
  expect(manifesto?.estado).toBe('publicada');
  expect(manifesto?.corpo).toContain('Nada do que você tem caiu do céu.');
  const { data: es } = await clienteAnonimo().from('traducoes').select('titulo, estado').eq('peca_id', manifesto!.id).single();
  expect(es).toEqual({ titulo: 'Manifiesto', estado: 'pronta' });

  const { data: modelo } = await db.from('pecas').select('estado').eq('tipo', 'newsletter').eq('numero', 999).single();
  expect(modelo?.estado).toBe('rascunho');
});
