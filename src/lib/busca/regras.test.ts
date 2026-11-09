import { describe, expect, test } from 'vitest';
import { custoBrl, custoMedio, horaDeRodar, inicioDoMes, podeRodar } from './regras';

describe('custo', () => {
  test('tokens e buscas em reais, arredondado a centavos', () => {
    // 200 mil de entrada (US$ 0,40) + 20 mil de saída (US$ 0,20) + 15 buscas (US$ 0,15) = US$ 0,75 × 5,6
    expect(custoBrl({ entrada: 200_000, saida: 20_000, buscas: 15 }, 5.6)).toBe(4.2);
    expect(custoBrl({ entrada: 0, saida: 0, buscas: 0 }, 5.6)).toBe(0);
  });

  test('cache: escrita a US$ 2,50 e leitura a US$ 0,20 por milhão', () => {
    // 100 mil escritos (US$ 0,25) + 1 milhão lidos (US$ 0,20) = US$ 0,45 × 5,6
    expect(custoBrl({ entrada: 0, saida: 0, buscas: 0, cacheEscrita: 100_000, cacheLeitura: 1_000_000 }, 5.6)).toBe(2.52);
  });

  test('custo médio: últimas 5 com custo; sem histórico, R$ 1,50', () => {
    expect(custoMedio([])).toBe(1.5);
    expect(custoMedio([{ custo_brl: 2 }, { custo_brl: 0 }, { custo_brl: 4 }])).toBe(3);
  });
});

describe('teto', () => {
  test('só roda se ainda couber uma rodada média', () => {
    expect(podeRodar(49.5, 50, 1.2)).toBe(false);
    expect(podeRodar(40, 50, 1.2)).toBe(true);
    expect(podeRodar(48.8, 50, 1.2)).toBe(true);
  });
});

describe('horaDeRodar', () => {
  const cfg = { ativo: true, dias: [1, 3, 5], hora: 7 };
  // Segunda, 9 de novembro de 2026. São Paulo = UTC−3.
  const sp = (hhmm: string, dia = '2026-11-09') => new Date(`${dia}T${hhmm}:00-03:00`);

  test('a partir da hora, no dia certo, uma vez por dia', () => {
    expect(horaDeRodar(sp('06:59'), cfg, null)).toBe(false);
    expect(horaDeRodar(sp('07:05'), cfg, null)).toBe(true);
    expect(horaDeRodar(sp('07:20'), cfg, sp('07:05'))).toBe(false);
    expect(horaDeRodar(sp('07:20'), cfg, sp('07:05', '2026-11-06'))).toBe(true);
  });

  test('dia fora da lista ou robô desligado não roda', () => {
    expect(horaDeRodar(sp('08:00', '2026-11-10'), cfg, null)).toBe(false);
    expect(horaDeRodar(sp('08:00'), { ...cfg, ativo: false }, null)).toBe(false);
  });

  test('início do mês no fuso de São Paulo', () => {
    expect(inicioDoMes(new Date('2026-12-01T01:00:00Z'))).toBe('2026-11-01T03:00:00.000Z');
    expect(inicioDoMes(new Date('2026-11-15T12:00:00Z'))).toBe('2026-11-01T03:00:00.000Z');
  });
});
