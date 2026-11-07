import { describe, expect, test } from 'vitest';
import { MODELO_TRADUCAO, lerResultado, pedidoDeLote, recolherPendentes } from './lote';

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

describe('recolherPendentes', () => {
  const pendente = { peca_id: original.id, lote_id: 'lote_1', original };
  const api = (status: string, resultados: { custom_id: string; result: unknown }[]) => ({
    retrieve: async () => ({ processing_status: status }),
    results: async () => (async function* () { yield* resultados; })(),
  }) as never;

  test('lote ainda rodando fica para a próxima vez', async () => {
    expect(await recolherPendentes([pendente], api('in_progress', []))).toEqual([]);
  });

  test('lote encerrado com sucesso vira pronta, não revisada', async () => {
    const r = await recolherPendentes([pendente], api('ended', [{ custom_id: original.id, result: sucesso({ titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1925, 15 días de vacaciones.' }) }]));
    expect(r).toEqual([{ peca_id: original.id, campos: { estado: 'pronta', revisado: false, erro: null, titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1925, 15 días de vacaciones.', legenda: null, aviso: null } }]);
  });

  test('um lote com defeito não trava os outros: 404 vira erro, falha passageira fica para a próxima', async () => {
    const outra = { ...pendente, peca_id: 'outra', lote_id: 'lote_2', original: { ...original, id: 'outra' } };
    const terceira = { ...pendente, peca_id: 'terceira', lote_id: 'lote_3', original: { ...original, id: 'terceira' } };
    const ok = sucesso({ titulo: 'En *1925*, la ley', resumo: 'Quince días.', corpo: 'En 1925, 15 días de vacaciones.' });
    const api = {
      retrieve: async (id: string) => {
        if (id === 'lote_1') throw Object.assign(new Error('not found'), { status: 404 });
        if (id === 'lote_2') throw Object.assign(new Error('overloaded'), { status: 529 });
        return { processing_status: 'ended' };
      },
      results: async () => (async function* () { yield { custom_id: 'terceira', result: ok }; })(),
    } as never;
    const r = await recolherPendentes([pendente, outra, terceira], api);
    expect(r.map((x) => [x.peca_id, x.campos.estado])).toEqual([[original.id, 'erro'], ['terceira', 'pronta']]);
    expect(r[0].campos.erro).toBe('o lote não existe mais na API; use "tentar de novo" no painel');
  });

  test('lote encerrado sem o resultado da peça vira erro', async () => {
    expect(await recolherPendentes([pendente], api('ended', []))).toEqual([{ peca_id: original.id, campos: { estado: 'erro', erro: 'o lote terminou sem resultado para esta peça' } }]);
  });
});
