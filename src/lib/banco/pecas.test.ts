import { describe, expect, test } from 'vitest';
import { emEspanhol, paraEdicao, paraObra, type LinhaPeca } from './pecas';
import { validarPublicavel } from '../edicoes';
import { validarObra } from '../cultura';

function linha(extra: Partial<LinhaPeca> = {}): LinhaPeca {
  return {
    id: 'uuid-1', tipo: 'newsletter', serie: 'memoria-operaria', numero: 4, slug: null, subtipo: null, autoria: 'PUKAS',
    titulo: 'Férias | não caíram | *do céu.*', resumo: 'r', legenda: 'l', aviso: null, corpo: '## Corpo\n\nEm 1925.',
    foto_caminho: 'memoria-operaria-4.jpg', foto_descricao: 'Operários', foto_credito: 'AN', foto_licenca: 'DP', foto_origem: null, video: null,
    fontes: [{ titulo: 'Lei', instituicao: 'Planalto', url: 'https://x', tipo: 'primaria', acessadaEm: '2026-11-01' }],
    checagem: { por: 'F', em: '2026-11-05' }, traduzir: true, estado: 'publicada', publicada_em: '2026-11-09T12:00:00Z',
    correcoes: [{ data: '2026-11-12', texto: 'Segunda' }, { data: '2026-11-10', texto: 'Primeira' }],
    traducoes: [],
    ...extra,
  };
}

describe('paraEdicao', () => {
  test('vira uma Edicao que validarPublicavel aceita, com datas como Date', () => {
    const e = paraEdicao(linha(), 'https://banco.supabase.co');
    expect(validarPublicavel(e)).toEqual([]);
    expect(e.data.publicadaEm).toEqual(new Date('2026-11-09T12:00:00Z'));
    expect(e.data.fontes[0].acessadaEm).toBeInstanceOf(Date);
    expect(e.data.checagem?.em).toBeInstanceOf(Date);
    expect(e.data.foto.arquivo).toBe('https://banco.supabase.co/storage/v1/object/public/fotos/memoria-operaria-4.jpg');
    expect(e.body).toBe('## Corpo\n\nEm 1925.');
  });

  test('correções em ordem de data', () => {
    expect(paraEdicao(linha(), 'u').data.correcoes.map((c) => c.texto)).toEqual(['Primeira', 'Segunda']);
  });
});

describe('links externos', () => {
  test('só http e https chegam ao site; javascript: e outros somem', () => {
    const l = linha({
      foto_origem: 'javascript:alert(1)',
      fontes: [
        { titulo: 'Boa', instituicao: 'I', url: 'https://planalto.gov.br', tipo: 'primaria', acessadaEm: '2026-11-01' },
        { titulo: 'Má', instituicao: 'I', url: ' JavaScript:fetch(1)', tipo: 'secundaria', acessadaEm: '2026-11-01' },
      ],
    });
    const e = paraEdicao(l, 'u');
    expect(e.data.fontes.map((f) => f.url)).toEqual(['https://planalto.gov.br', '']);
    expect(e.data.foto.origem).toBeUndefined();
    expect(paraObra(linha({ tipo: 'cultura', slug: 's', subtipo: 'conto', video: 'data:text/html,x' }), 'u').data.video).toBeUndefined();
  });
});

describe('paraObra', () => {
  test('o id da obra é o slug (endereço /cultura/<slug>)', () => {
    const o = paraObra(linha({ tipo: 'cultura', serie: null, slug: 'a-marmita', subtipo: 'poema', foto_caminho: null }), 'u');
    expect(o.id).toBe('a-marmita');
    expect(o.data.tipo).toBe('poema');
    expect(o.data.capa).toBeUndefined();
    expect(validarObra(o)).toEqual([]);
  });

  test('a etiqueta de cache usa o uuid, o mesmo que o painel invalida, não o slug do endereço', () => {
    expect(paraObra(linha({ tipo: 'cultura', slug: 'a-marmita', subtipo: 'poema' }), 'u').pecaId).toBe('uuid-1');
    expect(paraEdicao(linha(), 'u').pecaId).toBe('uuid-1');
  });
});

describe('emEspanhol', () => {
  const traducao = { idioma: 'es', titulo: 'Las vacaciones', resumo: 'res', legenda: null, aviso: null, corpo: '## Cuerpo\n\nEn 1925.', revisado: false, modelo: 'claude-sonnet-5-5', estado: 'pronta' as const };

  test('troca o texto e marca a tradução', () => {
    const e = emEspanhol(paraEdicao(linha({ traducoes: [traducao] }), 'u'), linha({ traducoes: [traducao] }));
    expect(e?.data.titulo).toBe('Las vacaciones');
    expect(e?.body).toBe('## Cuerpo\n\nEn 1925.');
    expect(e?.data.legenda).toBe('l');
    expect(e?.traducao).toEqual({ revisado: false, modelo: 'claude-sonnet-5-5' });
  });

  test('sem tradução pronta devolve null', () => {
    const pendente = { ...traducao, estado: 'pendente' as const };
    expect(emEspanhol(paraEdicao(linha(), 'u'), linha({ traducoes: [pendente] }))).toBeNull();
  });
});
