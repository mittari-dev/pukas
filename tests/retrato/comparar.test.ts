// O site lido do banco é o mesmo site de antes, endereço por endereço (plano, Tarefa 5).
// Roda com RETRATO_URL apontando para o site novo, com o banco já migrado (scripts/migrar-para-banco.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { retratarSite, type Retrato } from '../../scripts/retratar-site';
import { clienteServico, pecaValida } from '../banco/ajuda';

const base = process.env.RETRATO_URL;
const antes: Retrato[] = JSON.parse(readFileSync('tests/retrato/site-atual.json', 'utf-8'));

describe.skipIf(!base)('retrato', () => {
  test('cada endereço tem o mesmo status, manchete e texto', async () => {
    const depois = await retratarSite(base!);
    for (const a of antes) expect(depois.find((d) => d.url === a.url), a.url).toEqual(a);
  });

  // Roda antes de tests/retrato/vot*.test.ts, que publicam votações.
  test('/votacoes sem votação mostra o aviso de vazio', async () => {
    const html = await (await fetch(new URL('/votacoes', base))).text();
    expect(html).toContain('Ainda não há votações abertas.');
  });

  test('rascunho não aparece no site', async () => {
    expect((await fetch(new URL('/newsletter/memoria-operaria/999', base))).status).toBe(404);
  });

  test('/es de peça sem tradução mostra o original com aviso', async () => {
    const obra = { ...pecaValida('cultura'), titulo: 'Turno da noite', corpo: 'Texto só em português.' } as unknown as Record<string, unknown> & { slug: string };
    const { error } = await clienteServico().from('pecas').insert(obra);
    expect(error).toBeNull();
    const r = await fetch(new URL(`/es/cultura/${obra.slug}`, base));
    const html = await r.text();
    expect(r.status).toBe(200);
    expect(html).toContain('Texto só em português.');
    expect(html).toContain('TRADUCCIÓN EN CAMINO');
  });
});
