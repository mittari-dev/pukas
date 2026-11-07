import { describe, expect, test } from 'vitest';
import { conversar, slugDoRobo } from './robo';

const msg = (stop_reason: string, entrada: number, buscas = 0) =>
  ({ stop_reason, content: [{ type: 'text', text: stop_reason }], usage: { input_tokens: entrada, output_tokens: 10, server_tool_use: { web_search_requests: buscas } } }) as never;

const api = (respostas: unknown[]) => {
  const pedidos: unknown[] = [];
  return { pedidos, stream: (p: unknown) => (pedidos.push(structuredClone(p)), { finalMessage: async () => respostas.shift() as never }) };
};

describe('conversar', () => {
  test('pause_turn: devolve a conversa e continua; soma o uso das voltas', async () => {
    const a = api([msg('pause_turn', 100, 3), msg('end_turn', 50, 2)]);
    const r = await conversar(a, { messages: [{ role: 'user', content: 'oi' }] } as never);
    expect(a.pedidos).toHaveLength(2);
    expect((a.pedidos[1] as { messages: unknown[] }).messages).toHaveLength(2);
    expect(r.uso).toEqual({ entrada: 150, saida: 20, buscas: 5 });
    expect(r.mensagem.stop_reason).toBe('end_turn');
  });

  test('pausa demais vira erro', async () => {
    const a = api(Array.from({ length: 6 }, () => msg('pause_turn', 1)));
    await expect(conversar(a, { messages: [] } as never)).rejects.toThrow('pausou demais');
  });
});

describe('slugDoRobo', () => {
  test('sem acento, sem marcação da manchete, com sufixo', () => {
    expect(slugDoRobo('Greve | parou | o *porto* de São Paulo', 'a1b2')).toBe('greve-parou-o-porto-de-sao-paulo-a1b2');
    expect(slugDoRobo('|||', 'x')).toBe('noticia-x');
  });
});
