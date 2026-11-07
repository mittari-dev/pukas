// Exporta tudo o que está publicado para arquivo/publicado.json (spec painel §7). Roda todo dia no GitHub Actions,
// o que também mantém o Supabase grátis acordado. Usa só a chave anon: lê o mesmo que qualquer visitante.
// Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... npx tsx scripts/exportar-publicado.ts
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { montarArquivo } from '../src/lib/arquivo';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Defina SUPABASE_URL e SUPABASE_ANON_KEY.');
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// Em páginas de 1000: o PostgREST corta respostas maiores sem avisar.
async function tudo(tabela: string, ordem: string) {
  const linhas: Record<string, unknown>[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await db.from(tabela).select('*').order(ordem).range(de, de + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    linhas.push(...(data ?? []));
    if (!data || data.length < 1000) return linhas;
  }
}

const [pecas, traducoes, correcoes] = await Promise.all([tudo('pecas', 'id'), tudo('traducoes', 'peca_id'), tudo('correcoes', 'id')]);
const pasta = join(import.meta.dirname, '..', 'arquivo');
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, 'publicado.json'), montarArquivo(pecas, traducoes, correcoes));
console.log(`${pecas.length} peça(s), ${traducoes.length} tradução(ões), ${correcoes.length} correção(ões).`);
