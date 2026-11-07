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
    expect(leitura).toMatchObject({ type: 'web_fetch_20260209', allowed_domains: fontes, max_uses: 20 });
  });

  test('busca livre ligada: sem lista de domínios', () => {
    for (const f of ferramentas(fontes, true) as { allowed_domains?: string[] }[]) expect(f.allowed_domains).toBeUndefined();
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

  test('JSON fora do formato lança erro (a rodada vira "erro", nada entra pela metade)', () => {
    expect(() => validarPauta({ coisas: [] }, 10)).toThrow();
  });
});
