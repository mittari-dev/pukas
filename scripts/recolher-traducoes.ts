// Busca as traduções que já saíram do lote do Claude e grava no banco (spec painel §9). Roda no GitHub Actions a cada 15 min.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... RENOVAR_SEGREDO=... SITE_URL=... npx tsx scripts/recolher-traducoes.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { ETIQUETA_INDICE, etiquetaPeca } from '../src/lib/cache';
import { recolherPendentes, type Pendente } from '../src/lib/traducao/lote';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENOVAR_SEGREDO, SITE_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RENOVAR_SEGREDO || !SITE_URL) throw new Error('Faltam segredos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENOVAR_SEGREDO, SITE_URL.');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await db
  .from('traducoes')
  .select('peca_id, lote_id, pecas(id, titulo, resumo, legenda, aviso, corpo)')
  .eq('estado', 'pendente')
  .not('lote_id', 'is', null);
if (error) throw new Error(error.message);

const pendentes: Pendente[] = (data ?? []).map((l: any) => ({
  peca_id: l.peca_id,
  lote_id: l.lote_id,
  original: { ...l.pecas, legenda: l.pecas.legenda ?? undefined, aviso: l.pecas.aviso ?? undefined },
}));
const prontas = await recolherPendentes(pendentes, new Anthropic().messages.batches);

for (const { peca_id, campos } of prontas) {
  const { error } = await db.from('traducoes').update({ ...campos, atualizado_em: new Date().toISOString() }).eq('peca_id', peca_id).eq('idioma', 'es');
  if (error) throw new Error(`${peca_id}: ${error.message}`);
  console.log(`${peca_id}: ${campos.estado}${campos.erro ? ` (${campos.erro})` : ''}`);
}

if (prontas.length) {
  const r = await fetch(new URL('/api/renovar', SITE_URL), {
    method: 'POST',
    headers: { authorization: `Bearer ${RENOVAR_SEGREDO}`, 'content-type': 'application/json' },
    body: JSON.stringify({ etiquetas: [...prontas.map((p) => etiquetaPeca(p.peca_id)), ETIQUETA_INDICE] }),
  });
  if (!r.ok) throw new Error(`/api/renovar respondeu ${r.status}`);
}
console.log(`${pendentes.length} pendente(s), ${prontas.length} recolhida(s).`);
