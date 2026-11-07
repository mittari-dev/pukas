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

async function tudo(tabela: string) {
  const { data, error } = await db.from(tabela).select('*');
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return data ?? [];
}

const [pecas, traducoes, correcoes] = await Promise.all([tudo('pecas'), tudo('traducoes'), tudo('correcoes')]);
const pasta = join(import.meta.dirname, '..', 'arquivo');
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, 'publicado.json'), montarArquivo(pecas, traducoes, correcoes));
console.log(`${pecas.length} peça(s), ${traducoes.length} tradução(ões), ${correcoes.length} correção(ões).`);
