// Pedidos à API do Claude para a pauta e o rascunho (spec busca §5), e a validação do que volta.
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { ehLinkWeb } from '../link';
import { INSTRUCOES_PAUTA, INSTRUCOES_RASCUNHO } from './instrucoes';
import { normalizarUrl } from './robo';

export const MODELO_BUSCA = 'claude-sonnet-5-5';

// publicada_em: data da matéria (AAAA-MM-DD), lida na própria página; o código confere a janela com ela.
const Fonte = z.object({ veiculo: z.string(), titulo: z.string(), url: z.string(), fixa: z.boolean(), publicada_em: z.string() });
const Candidata = z.object({
  titulo: z.string(),
  porque: z.string(),
  regiao: z.enum(['brasil', 'america-latina', 'mundo']),
  tema: z.string(),
  fontes: z.array(Fonte),
  falta_confirmar: z.string().optional(),
});
export const Pauta = z.object({ candidatas: z.array(Candidata) });
export const Rascunho = z.object({ titulo: z.string(), resumo: z.string(), corpo: z.string(), fontes: z.array(Fonte.omit({ fixa: true, publicada_em: true })) });
export type CandidataPauta = z.infer<typeof Candidata>;
export type RascunhoRobo = z.infer<typeof Rascunho>;

export const formatoPauta = zodOutputFormat(Pauta);
export const formatoRascunho = zodOutputFormat(Rascunho);

// Busca livre desligada: busca e leitura só nos domínios das fontes fixas ativas.
export function ferramentas(fontesAtivas: string[], buscaLivre: boolean): Anthropic.Messages.ToolUnion[] {
  const dominios = buscaLivre ? {} : { allowed_domains: fontesAtivas };
  return [
    // Versões sem filtro dinâmico: com o filtro (_20260209), o resultado chegava quase vazio e o robô repetia
    // as mesmas buscas até o limite (rodadas de 09/11). Sem ele, o resultado vem inteiro.
    { type: 'web_search_20250305', name: 'web_search', max_uses: 12, ...dominios },
    // Teto de tamanho por leitura: o robô precisa ler cada candidata, e matérias inteiras estourariam o custo.
    { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 8, max_content_tokens: 5000, ...dominios },
  ];
}

interface Config {
  dias: number[];
  busca_livre: boolean;
  max_candidatas: number;
  temas_interessa: string[];
  temas_evita: string[];
}

const lista = (t: string[]) => (t.length ? t.map((x) => `- ${x}`).join('\n') : '- (nenhum)');

const dia = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(d);

const SEMANA = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const diaDaSemana = (d: Date) => SEMANA.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(d)) + 1;

// A janela começa no dia da rodada agendada anterior (dias do painel, 1 = segunda); sem agendamento, dois dias.
function desdeQuando(agora: Date, dias: number[]): Date {
  for (let k = 1; k <= 7; k++) {
    const d = new Date(agora.getTime() - k * 86_400_000);
    if (dias.includes(diaDaSemana(d))) return d;
  }
  return new Date(agora.getTime() - 2 * 86_400_000);
}

// Primeiro dia da janela (AAAA-MM-DD, horário de São Paulo), para conferir a data das fontes.
export const inicioDaJanela = (agora: Date, dias: number[]) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(desdeQuando(agora, dias));

// O modelo não sabe que dia é hoje: a data e a janela vão no pedido.
function quando(agora: Date, dias: number[]): string {
  const desde = desdeQuando(agora, dias);
  return `Hoje é ${dia(agora, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. Vale o que saiu de ${dia(desde, { day: 'numeric', month: 'long' })} até hoje.`;
}

export function pedidoPauta(cfg: Config, fontes: string[], descartes: { titulo: string; motivo: string }[], agora = new Date()): Anthropic.Messages.MessageCreateParamsStreaming {
  const texto = `Monte a pauta de hoje com até ${cfg.max_candidatas} candidatas. ${quando(agora, cfg.dias)}

Fontes fixas da casa (domínios). Busque nelas primeiro, com o operador site:, por exemplo "site:${fontes[0] ?? 'agenciabrasil.ebc.com.br'} greve":
${lista(fontes)}

Temas que interessam:
${lista(cfg.temas_interessa)}

Temas que não interessam:
${lista(cfg.temas_evita)}

Candidatas que a redação descartou recentemente, e o motivo (aprenda com isso):
${descartes.length ? descartes.map((d) => `- ${d.titulo}: ${d.motivo}`).join('\n') : '- (nenhuma)'}`;
  return {
    model: MODELO_BUSCA,
    max_tokens: 16000,
    stream: true,
    cache_control: { type: 'ephemeral' },
    system: INSTRUCOES_PAUTA,
    tools: ferramentas(fontes, cfg.busca_livre),
    output_config: { effort: 'medium', format: { type: formatoPauta.type, schema: formatoPauta.schema } },
    messages: [{ role: 'user', content: texto }],
  };
}

export function pedidoRascunho(c: Pick<CandidataPauta, 'titulo' | 'porque' | 'fontes' | 'falta_confirmar'>): Anthropic.Messages.MessageCreateParamsStreaming {
  const texto = `Escreva o rascunho desta notícia escolhida pela redação.

Assunto: ${c.titulo}
Por que importa: ${c.porque}
${c.falta_confirmar ? `Falta confirmar: ${c.falta_confirmar}\n` : ''}
Fontes para reler:
${c.fontes.map((f) => `- ${f.veiculo}: ${f.titulo} (${f.url})`).join('\n')}`;
  return {
    model: MODELO_BUSCA,
    max_tokens: 16000,
    stream: true,
    cache_control: { type: 'ephemeral' },
    system: INSTRUCOES_RASCUNHO,
    tools: ferramentas([], true),
    output_config: { effort: 'medium', format: { type: formatoRascunho.type, schema: formatoRascunho.schema } },
    messages: [{ role: 'user', content: texto }],
  };
}

interface Conferencia {
  vistas: Set<string>; // links que vieram da busca ou da leitura nesta rodada
  lidas: Set<string>; // links lidos inteiros
  desde: string; // início da janela, AAAA-MM-DD
  fixas: string[]; // domínios das fontes fixas
}

const dominio = (url: string) => new URL(url).hostname.replace(/^www\./, '');
const ehFixa = (url: string, fixas: string[]) => fixas.some((d) => dominio(url) === d || dominio(url).endsWith(`.${d}`));

// O que volta da API: JSON fora do formato lança (a rodada vira erro); candidata sem fonte web cai.
// Com a conferência (avaliação de 09/11): sai o link que o robô não viu; "fixa" vem do domínio, não do que o robô
// declarou; e cai a candidata sem nenhuma fonte lida inteira com data dentro da janela (trecho de busca e
// matéria antiga não são pauta).
export function validarPauta(json: unknown, max: number, conf?: Conferencia): { candidatas: CandidataPauta[]; descartadas: number } {
  const { candidatas } = Pauta.parse(json);
  const conferidas = candidatas.map((c) => {
    if (!conf) return c;
    const fontes = c.fontes.filter((f) => ehLinkWeb(f.url) && conf.vistas.has(normalizarUrl(f.url))).map((f) => ({ ...f, fixa: ehFixa(f.url, conf.fixas) }));
    const vale = fontes.some((f) => conf.lidas.has(normalizarUrl(f.url)) && f.publicada_em >= conf.desde);
    return vale ? { ...c, fontes } : { ...c, fontes: [] };
  });
  const boas = conferidas.filter((c) => c.fontes.length > 0 && c.fontes.every((f) => ehLinkWeb(f.url)));
  return { candidatas: boas.slice(0, max), descartadas: candidatas.length - boas.length };
}
