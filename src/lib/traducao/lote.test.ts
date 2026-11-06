import { describe, expect, test } from 'vitest';
import { MODELO_TRADUCAO, lerResultado, pedidoDeLote } from './lote';

const original = { id: '0b6f3c1e-1a2b-4c3d-8e9f-001122334455', titulo: 'Em *1925*, a lei', resumo: 'Quinze dias.', corpo: 'Em 1925, 15 dias de férias.' };

const sucesso = (json: unknown, stop_reason = 'end_turn') => ({
  type: 'succeeded' as const,
  message: { stop_reason, content: [{ type: 'text', text: JSON.stringify(json) }] },
}) as never;

describe('pedidoDeLote', () => {
  test('um pedido por peça, com o modelo barato e saída em JSON', () => {
    const p = pedidoDeLote(original);
    expect(p.custom_id).toBe(original.id);
    expect(p.params.model).toBe('claude-sonnet-5-5');
    expect(MODELO_TRADUCAO).toBe('claude-sonnet-5-5');
    expect(p.params.max_tokens).toBe(16000);
    expect(p.params.output_config?.format?.type).toBe('json_schema');
    expect(JSON.stringify(p.params.messages)).toContain('Em 1925, 15 dias de férias.');
  });
});

describe('lerResultado', () => {
  test('JSON válido com os mesmos números passa', () => {
    const r = lerResultado(original, sucesso({ titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1925, 15 días de vacaciones.' }));
    expect(r).toEqual({ ok: true, traducao: { titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1925, 15 días de vacaciones.' } });
  });

  test('número trocado não passa', () => {
    const r = lerResultado(original, sucesso({ titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1926, 15 días de vacaciones.' }));
    expect(r).toEqual({ ok: false, erro: 'faltam: 1925; sobram: 1926' });
  });

  test('recusa do modelo não passa', () => {
    expect(lerResultado(original, sucesso({}, 'refusal')).ok).toBe(false);
  });

  test('pedido com erro ou expirado não passa', () => {
    expect(lerResultado(original, { type: 'errored', error: { type: 'error', error: { type: 'api_error', message: 'x' } } } as never)).toEqual({ ok: false, erro: 'a API devolveu erro (api_error)' });
    expect(lerResultado(original, { type: 'expired' } as never)).toEqual({ ok: false, erro: 'o lote expirou antes de traduzir' });
  });
});
