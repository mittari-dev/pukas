import { describe, expect, test } from 'vitest';
import { pode } from './permissoes';

describe('pode (matriz da spec §4)', () => {
  test('todos criam, editam e enviam rascunho para revisão', () => {
    for (const papel of ['redator', 'revisor', 'editor'] as const) {
      expect(pode(papel, 'editar', 'rascunho')).toBe(true);
      expect(pode(papel, 'enviar_revisao', 'rascunho')).toBe(true);
    }
  });

  test('só revisor e editor rejeitam', () => {
    expect(pode('redator', 'rejeitar', 'em_revisao')).toBe(false);
    expect(pode('revisor', 'rejeitar', 'em_revisao')).toBe(true);
    expect(pode('editor', 'rejeitar', 'em_revisao')).toBe(true);
  });

  test('só editor publica', () => {
    expect(pode('redator', 'publicar', 'em_revisao')).toBe(false);
    expect(pode('revisor', 'publicar', 'em_revisao')).toBe(false);
    expect(pode('editor', 'publicar', 'em_revisao')).toBe(true);
    expect(pode('editor', 'publicar', 'publicada')).toBe(false);
  });

  test('peça publicada: só o editor mexe, e por correção', () => {
    expect(pode('redator', 'editar', 'publicada')).toBe(false);
    expect(pode('revisor', 'editar', 'publicada')).toBe(false);
    expect(pode('editor', 'editar', 'publicada')).toBe(true);
    expect(pode('editor', 'corrigir', 'publicada')).toBe(true);
    expect(pode('editor', 'corrigir', 'rascunho')).toBe(false);
  });

  test('não se rejeita o que já está no ar', () => {
    expect(pode('editor', 'rejeitar', 'publicada')).toBe(false);
  });
});
