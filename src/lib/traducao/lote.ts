// Tradução pt → es pela API de lotes do Claude (Message Batches: metade do preço, entrega em minutos).
// No publicar o servidor só envia; o workflow recolher-traducoes busca o resultado e grava.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { problemasDaTraducao } from '../traducao';
import { INSTRUCOES, Saida, type TextoTraduzivel } from './instrucoes';

// Mais barato que o Opus e bom em tradução; se o custo medido permitir, dá para baixar para claude-haiku-5-5.
export const MODELO_TRADUCAO = 'claude-sonnet-5-5';

const formato = zodOutputFormat(Saida);

export interface Original {
  id: string;
  titulo: string;
  resumo: string;
  legenda?: string;
  aviso?: string;
  corpo: string;
}

export function pedidoDeLote(peca: Original): Anthropic.Messages.Batches.BatchCreateParams.Request {
  const { id, ...texto } = peca;
  return {
    custom_id: id,
    params: {
      model: MODELO_TRADUCAO,
      max_tokens: 16000,
      system: INSTRUCOES,
      output_config: { effort: 'medium', format: { type: formato.type, schema: formato.schema } },
      messages: [{ role: 'user', content: `Traduza este texto. Devolva o JSON com os mesmos campos.\n\n${JSON.stringify(texto, null, 2)}` }],
    },
  };
}

export type Leitura = { ok: true; traducao: TextoTraduzivel } | { ok: false; erro: string };

export function lerResultado(original: Original, resultado: Anthropic.Messages.Batches.MessageBatchResult): Leitura {
  if (resultado.type === 'errored') return { ok: false, erro: `a API devolveu erro (${resultado.error.error.type})` };
  if (resultado.type !== 'succeeded') return { ok: false, erro: resultado.type === 'expired' ? 'o lote expirou antes de traduzir' : 'o lote foi cancelado' };
  const { message } = resultado;
  if (message.stop_reason === 'refusal') return { ok: false, erro: 'o modelo recusou a tradução' };
  const texto = message.content.find((b) => b.type === 'text');
  if (!texto || texto.type !== 'text') return { ok: false, erro: `resposta sem texto (stop_reason: ${message.stop_reason})` };
  let traducao: TextoTraduzivel;
  try {
    traducao = formato.parse(texto.text);
  } catch {
    return { ok: false, erro: `resposta sem JSON válido (stop_reason: ${message.stop_reason})` };
  }
  const problemas = problemasDaTraducao(original, traducao);
  return problemas.length ? { ok: false, erro: problemas.join('; ') } : { ok: true, traducao };
}

// Chamado ao publicar. Nunca derruba a publicação: se falhar, a tradução fica com estado "erro" e o motivo.
export async function enviarTraducao(cliente: SupabaseClient, pecaId: string): Promise<void> {
  const marcar = (campos: Record<string, unknown>) => cliente.from('traducoes').upsert({ peca_id: pecaId, idioma: 'es', revisado: false, ...campos });
  try {
    const { data: p, error } = await cliente.from('pecas').select('id, titulo, resumo, legenda, aviso, corpo').eq('id', pecaId).single();
    if (error) throw new Error(error.message);
    const original: Original = { id: p.id, titulo: p.titulo, resumo: p.resumo, corpo: p.corpo, legenda: p.legenda ?? undefined, aviso: p.aviso ?? undefined };
    const lote = await new Anthropic().messages.batches.create({ requests: [pedidoDeLote(original)] });
    await marcar({ estado: 'pendente', lote_id: lote.id, modelo: MODELO_TRADUCAO, erro: null });
  } catch (erro) {
    await marcar({ estado: 'erro', erro: erro instanceof Error ? erro.message : String(erro) });
  }
}

export interface Pendente {
  peca_id: string;
  lote_id: string;
  original: Original;
}

type ApiLotes = Pick<Anthropic.Messages.Batches, 'retrieve' | 'results'>;

// Chamado pelo workflow recolher-traducoes. Devolve o que gravar em traducoes; lote ainda rodando fica de fora.
export async function recolherPendentes(pendentes: Pendente[], api: ApiLotes): Promise<{ peca_id: string; campos: Record<string, unknown> }[]> {
  const saida = [];
  for (const p of pendentes) {
    let leitura: Leitura = { ok: false, erro: 'o lote terminou sem resultado para esta peça' };
    // Uma peça com problema não pode travar as outras: 404 é definitivo, o resto tenta de novo na próxima rodada.
    try {
      if ((await api.retrieve(p.lote_id)).processing_status !== 'ended') continue;
      for await (const r of await api.results(p.lote_id)) if (r.custom_id === p.peca_id) leitura = lerResultado(p.original, r.result);
    } catch (erro) {
      if ((erro as { status?: number }).status !== 404) continue;
      leitura = { ok: false, erro: 'o lote não existe mais na API; use "tentar de novo" no painel' };
    }
    if (!leitura.ok) {
      saida.push({ peca_id: p.peca_id, campos: { estado: 'erro', erro: leitura.erro } });
      continue;
    }
    const t = leitura.traducao;
    saida.push({ peca_id: p.peca_id, campos: { estado: 'pronta', revisado: false, erro: null, titulo: t.titulo, resumo: t.resumo, corpo: t.corpo, legenda: t.legenda ?? null, aviso: t.aviso ?? null } });
  }
  return saida;
}
