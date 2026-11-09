import { describe, expect, test } from 'vitest';
import { recebe, seriesEscolhidas } from './series';

describe('assinatura por série', () => {
  test('fica só o que é série ativa, sem repetir', () => {
    expect(seriesEscolhidas(['memoria-operaria', 'inventada', 'memoria-operaria'], ['memoria-operaria', 'trincheira'])).toEqual(['memoria-operaria']);
  });
  test('marcou todas, ou nenhuma, ou só existe uma série: lista vazia, que quer dizer "todas"', () => {
    expect(seriesEscolhidas(['a', 'b'], ['a', 'b'])).toEqual([]);
    expect(seriesEscolhidas([], ['a', 'b'])).toEqual([]);
    expect(seriesEscolhidas(['a'], ['a'])).toEqual([]);
  });
  test('quem assinou antes da escolha (lista vazia) recebe todas; quem escolheu, só as suas', () => {
    expect(recebe([], 'trincheira')).toBe(true);
    expect(recebe(['memoria-operaria'], 'memoria-operaria')).toBe(true);
    expect(recebe(['memoria-operaria'], 'trincheira')).toBe(false);
  });
});
