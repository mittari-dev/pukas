// Robô do plenário (spec consultas §6): uma vez por dia, sem IA. Para cada votação publicada, pergunta à casa se houve
// votação nominal no plenário, grava placar e votos e fecha a votação quando é o caso. Erro numa votação não para as outras.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RENOVAR_SEGREDO=... SITE_URL=... npx tsx scripts/plenario.ts
import { createClient } from '@supabase/supabase-js';
import { ETIQUETA_INDICE, etiquetaPeca } from '../src/lib/cache';
import { votacoesNominais, type VotacaoNominal } from '../src/lib/votacoes/congresso';
import { planoDoDia, type VotacaoDoRobo } from '../src/lib/votacoes/plenario';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENOVAR_SEGREDO, SITE_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RENOVAR_SEGREDO || !SITE_URL) throw new Error('Faltam segredos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENOVAR_SEGREDO, SITE_URL.');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const agora = new Date();

const { data, error } = await db.from('pecas').select('id, proposicao, publicada_em, fecha_em, plenario_votacoes(id_oficial)').eq('tipo', 'votacao').eq('estado', 'publicada');
if (error) throw new Error(error.message);
const votacoes: VotacaoDoRobo[] = (data ?? [])
  .filter((l: any) => l.proposicao && l.publicada_em)
  .map((l: any) => ({ id: l.id, proposicao: l.proposicao, publicada_em: l.publicada_em, fecha_em: l.fecha_em, gravadas: (l.plenario_votacoes ?? []).map((p: any) => p.id_oficial) }));

const achadas = new Map<string, VotacaoNominal[]>();
for (const v of votacoes) {
  try {
    achadas.set(v.id, await votacoesNominais(v.proposicao, new Date(v.publicada_em)));
  } catch (e) {
    console.error(`${v.id} (${v.proposicao.sigla} ${v.proposicao.numero}/${v.proposicao.ano}): ${(e as Error).message}`);
  }
}

const { gravar, fechar } = planoDoDia(votacoes, achadas, agora);
const mudaram = new Set<string>();
for (const { votacaoId, votacao: n } of gravar) {
  const casa = votacoes.find((v) => v.id === votacaoId)!.proposicao.casa;
  const { data: p, error: e } = await db
    .from('plenario_votacoes')
    .insert({ votacao_id: votacaoId, casa, id_oficial: n.idOficial, data: n.data.toISOString(), descricao: n.descricao, sim: n.sim, nao: n.nao, abstencao: n.abstencao, outros: n.outros })
    .select('id')
    .single();
  if (e) {
    console.error(`${votacaoId}/${n.idOficial}: ${e.message}`);
    continue;
  }
  const { error: ev } = await db.from('plenario_votos').insert(n.votos.map((x) => ({ plenario_id: p.id, ...x })));
  if (ev) console.error(`${votacaoId}/${n.idOficial} votos: ${ev.message}`);
  mudaram.add(votacaoId);
}
// Só antecipa: votação cujo prazo já passou fica com o prazo que tinha.
for (const id of fechar) {
  const { error: e } = await db.from('pecas').update({ fecha_em: agora.toISOString() }).eq('id', id).gt('fecha_em', agora.toISOString());
  if (e) console.error(`${id} fechar: ${e.message}`);
  else mudaram.add(id);
}

if (mudaram.size) {
  const r = await fetch(new URL('/api/renovar', SITE_URL), {
    method: 'POST',
    headers: { authorization: `Bearer ${RENOVAR_SEGREDO}`, 'content-type': 'application/json' },
    body: JSON.stringify({ etiquetas: [...[...mudaram].map(etiquetaPeca), ETIQUETA_INDICE] }),
  });
  if (!r.ok) throw new Error(`/api/renovar respondeu ${r.status}`);
}
console.log(`${votacoes.length} votação(ões), ${gravar.length} nominal(is) nova(s), ${fechar.length} fechada(s) hoje.`);
