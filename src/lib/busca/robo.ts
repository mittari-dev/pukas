// Conversa com a API até a resposta final (spec busca §5). A busca e a leitura rodam no servidor da
// Anthropic; quando ele para no limite de voltas (pause_turn), devolvemos a conversa e ele continua.
import type Anthropic from '@anthropic-ai/sdk';

export interface Uso {
  entrada: number;
  saida: number;
  buscas: number;
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

export async function conversar(api: Api, pedido: Anthropic.Messages.MessageCreateParamsStreaming): Promise<{ mensagem: Anthropic.Messages.Message; uso: Uso }> {
  const uso: Uso = { entrada: 0, saida: 0, buscas: 0 };
  const messages = [...pedido.messages];
  for (let volta = 0; volta < MAX_VOLTAS; volta++) {
    const mensagem = await api.stream({ ...pedido, messages }).finalMessage();
    uso.entrada += mensagem.usage.input_tokens;
    uso.saida += mensagem.usage.output_tokens;
    uso.buscas += mensagem.usage.server_tool_use?.web_search_requests ?? 0;
    if (mensagem.stop_reason !== 'pause_turn') return { mensagem, uso };
    messages.push({ role: 'assistant', content: mensagem.content });
  }
  throw new ErroDoRobo('a API pausou demais sem terminar', uso);
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
