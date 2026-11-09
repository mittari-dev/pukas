// Conversa com a API até a resposta final (spec busca §5). A busca e a leitura rodam no servidor da
// Anthropic; quando ele para no limite de voltas (pause_turn), devolvemos a conversa e ele continua.
import type Anthropic from '@anthropic-ai/sdk';

export interface Uso {
  entrada: number;
  saida: number;
  buscas: number;
  cacheEscrita?: number;
  cacheLeitura?: number;
}

interface Api {
  stream(p: Anthropic.Messages.MessageCreateParamsStreaming): { finalMessage(): Promise<Anthropic.Messages.Message> };
}

// O erro leva o uso até ali: o que já foi gasto conta no teto mesmo quando a rodada falha.
export class ErroDoRobo extends Error {
  constructor(mensagem: string, readonly uso: Uso) {
    super(mensagem);
  }
}

const MAX_VOLTAS = 5;

export async function conversar(api: Api, pedido: Anthropic.Messages.MessageCreateParamsStreaming): Promise<{ mensagem: Anthropic.Messages.Message; uso: Uso; blocos: Anthropic.Messages.ContentBlock[] }> {
  const uso: Required<Uso> = { entrada: 0, saida: 0, buscas: 0, cacheEscrita: 0, cacheLeitura: 0 };
  const messages = [...pedido.messages];
  const blocos: Anthropic.Messages.ContentBlock[] = [];
  for (let volta = 0; volta < MAX_VOLTAS; volta++) {
    const mensagem = await api.stream({ ...pedido, messages }).finalMessage();
    uso.entrada += mensagem.usage.input_tokens;
    uso.saida += mensagem.usage.output_tokens;
    uso.cacheEscrita += mensagem.usage.cache_creation_input_tokens ?? 0;
    uso.cacheLeitura += mensagem.usage.cache_read_input_tokens ?? 0;
    uso.buscas += mensagem.usage.server_tool_use?.web_search_requests ?? 0;
    blocos.push(...mensagem.content);
    if (mensagem.stop_reason !== 'pause_turn') return { mensagem, uso, blocos };
    messages.push({ role: 'assistant', content: mensagem.content });
  }
  throw new ErroDoRobo('a API pausou demais sem terminar', uso);
}

// Diário da rodada para o log do Actions: o que buscou, o que leu e o que deu errado.
export function diario(blocos: Anthropic.Messages.ContentBlock[]): string[] {
  const linhas: string[] = [];
  for (const b of blocos as unknown as { type: string; name?: string; input?: { query?: string; url?: string }; content?: unknown }[]) {
    // code_execution é o filtro interno da busca (dynamic filtering): não entra no diário.
    if (b.type === 'server_tool_use' && b.name !== 'code_execution') linhas.push(b.name === 'web_search' ? `busca: ${b.input?.query}` : `leitura: ${b.input?.url}`);
    else if (b.type === 'web_search_tool_result' || b.type === 'web_fetch_tool_result') {
      const c = b.content as { error_code?: string } | unknown[];
      if (Array.isArray(c)) linhas.push(`  → ${c.length} resultado(s)`);
      else linhas.push(c?.error_code ? `  → erro ${c.error_code}` : '  → ok');
    }
  }
  return linhas;
}

// Endereço sem âncora e sem barra no fim, para comparar o que o robô citou com o que ele viu.
export const normalizarUrl = (u: string) => u.replace(/#.*$/, '').replace(/\/+$/, '');

// O que o robô viu de verdade: links que vieram da busca ou da leitura, e os que ele leu inteiros.
export function urlsVistas(blocos: Anthropic.Messages.ContentBlock[]): { vistas: Set<string>; lidas: Set<string> } {
  const vistas = new Set<string>();
  const lidas = new Set<string>();
  for (const b of blocos as unknown as { type: string; content?: unknown }[]) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const r of b.content as { url?: string }[]) if (r.url) vistas.add(normalizarUrl(r.url));
    if (b.type === 'web_fetch_tool_result') {
      const c = b.content as { type?: string; url?: string };
      if (c?.type === 'web_fetch_result' && c.url) {
        vistas.add(normalizarUrl(c.url));
        lidas.add(normalizarUrl(c.url));
      }
    }
  }
  return { vistas, lidas };
}

// O texto final (o JSON do output_config) é o último bloco de texto da resposta.
export function textoFinal(m: Anthropic.Messages.Message): string {
  if (m.stop_reason === 'refusal') throw new Error('o modelo recusou a tarefa');
  const blocos = m.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text');
  if (!blocos.length) throw new Error(`resposta sem texto (stop_reason: ${m.stop_reason})`);
  return blocos.at(-1)!.text;
}

// Endereço da notícia a partir do título: minúsculas, sem acento nem marcação, mais um sufixo curto para não repetir.
export function slugDoRobo(titulo: string, sufixo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[|*]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');
  return `${base || 'noticia'}-${sufixo}`;
}
