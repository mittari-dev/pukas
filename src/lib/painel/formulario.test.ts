import { describe, expect, test } from 'vitest';
import { lerFormularioPeca, linksInvalidos, paraLinha } from './formulario';
import { traduzirErroBanco } from './erros';

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.append(k, v);
  return f;
}

const newsletter = {
  serie: 'memoria-operaria', numero: '4', titulo: 'Férias | não caíram | *do céu.*', resumo: 'r', corpo: 'Texto.',
  checagem_por: 'Fundador', checagem_em: '2026-11-05',
  'fonte[0][titulo]': 'Lei 4.982', 'fonte[0][instituicao]': 'Planalto', 'fonte[0][url]': 'https://planalto.gov.br', 'fonte[0][tipo]': 'primaria', 'fonte[0][acessadaEm]': '2026-11-01',
  'fonte[1][titulo]': 'Jornal', 'fonte[1][instituicao]': 'BN', 'fonte[1][url]': 'https://bn.gov.br', 'fonte[1][tipo]': 'secundaria', 'fonte[1][acessadaEm]': '2026-11-02',
  'fonte[2][titulo]': '', 'fonte[2][url]': '',
  traduzir: 'on',
};

describe('lerFormularioPeca', () => {
  test('duas fontes, checagem e datas como Date', () => {
    const p = lerFormularioPeca(form(newsletter), 'newsletter', 'rascunho');
    expect(p.numero).toBe(4);
    expect(p.fontes).toHaveLength(2);
    expect(p.fontes[1]).toEqual({ titulo: 'Jornal', instituicao: 'BN', url: 'https://bn.gov.br', tipo: 'secundaria', acessadaEm: new Date('2026-11-02') });
    expect(p.checagem).toEqual({ por: 'Fundador', em: new Date('2026-11-05') });
    expect(p.traduzir).toBe(true);
  });

  test('sem foto, foto fica undefined; campos vazios viram undefined', () => {
    const p = lerFormularioPeca(form({ ...newsletter, legenda: '  ', checagem_por: '' }), 'newsletter', 'rascunho');
    expect(p.foto).toBeUndefined();
    expect(p.legenda).toBeUndefined();
    expect(p.checagem).toBeUndefined();
  });

  test('foto com caminho já enviado', () => {
    const p = lerFormularioPeca(form({ ...newsletter, foto_caminho: 'a.jpg', foto_descricao: 'Operários', foto_credito: 'AN', foto_licenca: 'DP' }), 'newsletter', 'rascunho');
    expect(p.foto).toEqual({ caminho: 'a.jpg', descricao: 'Operários', credito: 'AN', licenca: 'DP', origem: undefined });
  });

  test('traduzir desmarcado', () => {
    const { traduzir, ...sem } = newsletter;
    expect(lerFormularioPeca(form(sem), 'newsletter', 'rascunho').traduzir).toBe(false);
  });
});

describe('linksInvalidos', () => {
  test('aponta link de fonte, origem da foto ou vídeo que não é http(s)', () => {
    const p = lerFormularioPeca(form({ ...newsletter, 'fonte[1][url]': 'javascript:alert(1)', foto_caminho: 'a.jpg', foto_origem: 'ftp://x', video: 'https://youtu.be/x' }), 'newsletter', 'rascunho');
    expect(linksInvalidos(p)).toEqual(['fonte "Jornal"', 'origem da foto']);
    expect(linksInvalidos(lerFormularioPeca(form(newsletter), 'newsletter', 'rascunho'))).toEqual([]);
  });
});

describe('paraLinha', () => {
  test('nomes das colunas e datas em texto', () => {
    const l = paraLinha(lerFormularioPeca(form({ ...newsletter, foto_caminho: 'a.jpg', foto_descricao: 'd' }), 'newsletter', 'rascunho'));
    expect(l).toMatchObject({ tipo: 'newsletter', serie: 'memoria-operaria', numero: 4, foto_caminho: 'a.jpg', foto_credito: null, estado: 'rascunho' });
    expect(l.checagem).toEqual({ por: 'Fundador', em: '2026-11-05' });
    expect((l.fontes as { acessadaEm: string }[])[0].acessadaEm).toBe('2026-11-01');
  });
});

describe('traduzirErroBanco', () => {
  test('número repetido vira frase', () => {
    expect(traduzirErroBanco({ code: '23505', message: 'duplicate key', details: 'Key (tipo, serie, numero)=(newsletter, memoria-operaria, 4) already exists.' })).toBe('Já existe a edição Nº 004');
    expect(traduzirErroBanco({ code: '23505', message: 'duplicate key', details: 'Key (tipo, slug)=(noticia, greve-geral) already exists.' })).toBe('Já existe uma peça com o endereço "greve-geral"');
  });

  test('trava editorial devolve a mensagem do banco', () => {
    expect(traduzirErroBanco({ code: 'P0001', message: 'sem checagem; manchete com 9 palavras (máx. 8)' })).toBe('Não dá para publicar: sem checagem; manchete com 9 palavras (máx. 8)');
  });

  test('o resto vira mensagem genérica', () => {
    expect(traduzirErroBanco({ code: '42501', message: 'new row violates row-level security policy' })).toBe('Não deu para salvar. Tente de novo.');
  });
});
