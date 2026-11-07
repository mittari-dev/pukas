import { describe, expect, test } from 'vitest';
import { atrasado, espacosDoRitmo, gradeDoMes, hojeEmSaoPaulo, semanaDe, situacaoDoItem } from './agenda';

describe('datas', () => {
  test('semana de segunda a domingo', () => {
    expect(semanaDe('2026-11-11')).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
    expect(semanaDe('2026-11-15')[0]).toBe('2026-11-09');
  });

  test('semana que atravessa o ano', () => {
    expect(semanaDe('2027-01-01')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  });

  test('grade do mês: semanas completas de segunda a domingo', () => {
    const g = gradeDoMes('2026-11-15');
    expect(g).toHaveLength(6);
    expect(g[0][0]).toBe('2026-10-26');
    expect(g.at(-1)!.at(-1)).toBe('2026-12-06');
    expect(g.every((s) => s.length === 7)).toBe(true);
  });

  test('hoje é o de São Paulo, não o de UTC', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-09T02:30:00Z'))).toBe('2026-11-08');
    expect(hojeEmSaoPaulo(new Date('2026-11-09T12:00:00Z'))).toBe('2026-11-09');
  });
});

describe('situacaoDoItem', () => {
  const solto = { situacao: 'pronta' as const, peca_id: null };
  const ligado = { situacao: 'ideia' as const, peca_id: 'p1' };

  test('sem peça vale a situação manual', () => {
    expect(situacaoDoItem(solto)).toBe('pronta');
  });

  test('com peça, acompanha o estado dela', () => {
    expect(situacaoDoItem(ligado, 'rascunho')).toBe('escrevendo');
    expect(situacaoDoItem(ligado, 'em_revisao')).toBe('em_revisao');
    expect(situacaoDoItem(ligado, 'publicada')).toBe('publicada');
    expect(situacaoDoItem(ligado, 'rejeitada')).toBe('ideia');
  });

  test('peça ligada que sumiu (sem estado) volta à situação manual', () => {
    expect(situacaoDoItem(ligado)).toBe('ideia');
  });
});

describe('atrasado', () => {
  test('dia passado e ainda não publicado', () => {
    expect(atrasado('2026-11-02', 'pronta', '2026-11-05')).toBe(true);
    expect(atrasado('2026-11-02', 'publicada', '2026-11-05')).toBe(false);
    expect(atrasado('2026-11-05', 'ideia', '2026-11-05')).toBe(false);
    expect(atrasado('2026-11-09', 'ideia', '2026-11-05')).toBe(false);
  });
});

describe('espacosDoRitmo', () => {
  const semana = semanaDe('2026-11-11');
  const memoria = { dia_semana: 1, tipo: 'newsletter', serie: 'memoria-operaria', rotulo: null, ativo: true };

  test('segunda sem item: um espaço', () => {
    expect(espacosDoRitmo(semana, [memoria], [])).toEqual([{ dia: '2026-11-09', tipo: 'newsletter', serie: 'memoria-operaria', rotulo: null }]);
  });

  test('item do mesmo tipo e série ocupa o espaço', () => {
    expect(espacosDoRitmo(semana, [memoria], [{ dia: '2026-11-09', tipo: 'newsletter', serie: 'memoria-operaria' }])).toEqual([]);
  });

  test('item de outra série ou outro tipo não ocupa', () => {
    expect(espacosDoRitmo(semana, [memoria], [{ dia: '2026-11-09', tipo: 'newsletter', serie: 'outra' }])).toHaveLength(1);
    expect(espacosDoRitmo(semana, [memoria], [{ dia: '2026-11-09', tipo: 'noticia', serie: null }])).toHaveLength(1);
  });

  test('compromisso pausado não aparece; domingo é 7', () => {
    expect(espacosDoRitmo(semana, [{ ...memoria, ativo: false }], [])).toEqual([]);
    expect(espacosDoRitmo(semana, [{ ...memoria, dia_semana: 7, tipo: 'noticia', serie: null }], [])[0].dia).toBe('2026-11-15');
  });
});
