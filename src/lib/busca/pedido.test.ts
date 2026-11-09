import { describe, expect, test } from 'vitest';
import { ferramentas, pedidoPauta, pedidoRascunho, validarPauta } from './pedido';

const cfg = { busca_livre: false, max_candidatas: 10, temas_interessa: ['trabalho por aplicativo'], temas_evita: ['futebol'] };
const fontes = ['agenciabrasil.ebc.com.br', 'reuters.com'];
const fonte = { veiculo: 'Agência Brasil', titulo: 'Greve', url: 'https://agenciabrasil.ebc.com.br/x', fixa: true };
const candidata = (titulo: string, extra = {}) => ({ titulo, porque: 'Pesa no salário.', regiao: 'brasil', tema: 'trabalho', fontes: [fonte], ...extra });

describe('ferramentas', () => {
  test('busca livre desligada: busca e leitura presas às fontes fixas', () => {
    const [busca, leitura] = ferramentas(fontes, false) as { type: string; allowed_domains?: string[]; max_uses?: number }[];
    expect(busca).toMatchObject({ type: 'web_search_20260209', allowed_domains: fontes, max_uses: 15 });
    expect(leitura).toMatchObject({ type: 'web_fetch_20260209', allowed_domains: fontes, max_uses: 12 });
  });

  test('busca livre ligada: sem lista de domínios', () => {
    for (const f of ferramentas(fontes, true) as { allowed_domains?: string[] }[]) expect(f.allowed_domains).toBeUndefined();
  });

  test('leitura com teto de tamanho, para a leitura obrigatória não estourar o custo', () => {
    const [, leitura] = ferramentas(fontes, true) as { max_content_tokens?: number; max_uses?: number }[];
    expect(leitura).toMatchObject({ max_content_tokens: 6000, max_uses: 12 });
  });
});

describe('pedidos', () => {
  test('pauta: modelo, streaming, JSON e as regras editoriais', () => {
    const p = pedidoPauta(cfg, fontes, [{ titulo: 'Jogo do Flamengo', motivo: 'não é sobre trabalho' }]);
    expect(p.model).toBe('claude-sonnet-5-5');
    expect(p.stream).toBe(true);
    expect(p.output_config?.format?.type).toBe('json_schema');
    expect(String(p.system)).toContain('nunca afirme crime');
    const texto = JSON.stringify(p.messages);
    expect(texto).toContain('trabalho por aplicativo');
    expect(texto).toContain('não é sobre trabalho');
    expect(texto).toContain('até 10');
  });

  test('pauta: diz a data de hoje e a janela (na segunda, desde sexta)', () => {
    const segunda = new Date('2026-11-09T10:00:00-03:00');
    const texto = JSON.stringify(pedidoPauta(cfg, fontes, [], segunda).messages);
    expect(texto).toContain('Hoje é segunda-feira, 9 de novembro de 2026');
    expect(texto).toContain('de 6 de novembro');
    const quarta = new Date('2026-11-11T10:00:00-03:00');
    expect(JSON.stringify(pedidoPauta(cfg, fontes, [], quarta).messages)).toContain('de 9 de novembro');
  });

  test('pauta: manda buscar nas fontes fixas com site: e ler antes de pôr na pauta', () => {
    const p = pedidoPauta(cfg, fontes, []);
    expect(JSON.stringify(p.messages)).toContain('site:agenciabrasil.ebc.com.br');
    expect(String(p.system)).toContain('web_fetch');
  });

  test('rascunho: relê as fontes da candidata', () => {
    const p = pedidoRascunho(candidata('Greve no porto'));
    expect(p.output_config?.format?.type).toBe('json_schema');
    expect(JSON.stringify(p.messages)).toContain('https://agenciabrasil.ebc.com.br/x');
  });
});

describe('validarPauta', () => {
  test('corta no máximo e tira candidata sem fonte ou com link que não é web', () => {
    const doze = Array.from({ length: 12 }, (_, i) => candidata(`Notícia ${i}`));
    expect(validarPauta({ candidatas: doze }, 10).candidatas).toHaveLength(10);

    const r = validarPauta({ candidatas: [candidata('Boa'), candidata('Sem fonte', { fontes: [] }), candidata('Link ruim', { fontes: [{ ...fonte, url: 'javascript:x' }] })] }, 10);
    expect(r.candidatas.map((c) => c.titulo)).toEqual(['Boa']);
    expect(r.descartadas).toBe(2);
  });

  test('fonte que o robô não viu na busca nem leu cai; sem nenhuma lida, avisa no "falta confirmar"', () => {
    const vista = { ...fonte, url: 'https://agenciabrasil.ebc.com.br/vista/' };
    const lida = { ...fonte, url: 'https://reuters.com/lida' };
    const inventada = { ...fonte, url: 'https://reuters.com/inventada' };
    const vistos = { vistas: new Set(['https://agenciabrasil.ebc.com.br/vista', 'https://reuters.com/lida']), lidas: new Set(['https://reuters.com/lida']) };
    const r = validarPauta(
      { candidatas: [candidata('Lida', { fontes: [lida, inventada] }), candidata('Só vista', { fontes: [vista], falta_confirmar: 'O valor.' }), candidata('Inventada', { fontes: [inventada] })] },
      10,
      vistos,
    );
    expect(r.candidatas.map((c) => c.titulo)).toEqual(['Lida', 'Só vista']);
    expect(r.candidatas[0].fontes).toEqual([lida]);
    expect(r.candidatas[0].falta_confirmar).toBeUndefined();
    expect(r.candidatas[1].falta_confirmar).toBe('O valor. O robô não leu nenhuma fonte inteira, só o trecho da busca.');
    expect(r.descartadas).toBe(1);
  });

  test('JSON fora do formato lança erro (a rodada vira "erro", nada entra pela metade)', () => {
    expect(() => validarPauta({ coisas: [] }, 10)).toThrow();
  });
});
