// Pedidos à API do Claude para a pauta e o rascunho (spec busca §5), e a validação do que volta.
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { ehLinkWeb } from '../link';
import { INSTRUCOES_PAUTA, INSTRUCOES_RASCUNHO } from './instrucoes';

export const MODELO_BUSCA = 'claude-sonnet-5-5';

const Fonte = z.object({ veiculo: z.string(), titulo: z.string(), url: z.string(), fixa: z.boolean() });
const Candidata = z.object({
  titulo: z.string(),
  porque: z.string(),
  regiao: z.enum(['brasil', 'america-latina', 'mundo']),
  tema: z.string(),
  fontes: z.array(Fonte),
  falta_confirmar: z.string().optional(),
});
export const Pauta = z.object({ candidatas: z.array(Candidata) });
export const Rascunho = z.object({ titulo: z.string(), resumo: z.string(), corpo: z.string(), fontes: z.array(Fonte.omit({ fixa: true })) });
export type CandidataPauta = z.infer<typeof Candidata>;
export type RascunhoRobo = z.infer<typeof Rascunho>;

export const formatoPauta = zodOutputFormat(Pauta);
export const formatoRascunho = zodOutputFormat(Rascunho);

// Busca livre desligada: busca e leitura só nos domínios das fontes fixas ativas.
export function ferramentas(fontesAtivas: string[], buscaLivre: boolean): Anthropic.Messages.ToolUnion[] {
  const dominios = buscaLivre ? {} : { allowed_domains: fontesAtivas };
  return [
    { type: 'web_search_20260209', name: 'web_search', max_uses: 15, ...dominios },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 20, ...dominios },
  ];
}

interface Config {
  busca_livre: boolean;
  max_candidatas: number;
  temas_interessa: string[];
  temas_evita: string[];
}

const lista = (t: string[]) => (t.length ? t.map((x) => `- ${x}`).join('\n') : '- (nenhum)');

export function pedidoPauta(cfg: Config, fontes: string[], descartes: { titulo: string; motivo: string }[]): Anthropic.Messages.MessageCreateParamsStreaming {
  const texto = `Monte a pauta de hoje com até ${cfg.max_candidatas} candidatas.

Fontes fixas da casa (domínios):
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
    system: INSTRUCOES_RASCUNHO,
    tools: ferramentas([], true),
    output_config: { effort: 'medium', format: { type: formatoRascunho.type, schema: formatoRascunho.schema } },
    messages: [{ role: 'user', content: texto }],
  };
}

// O que volta da API: JSON fora do formato lança (a rodada vira erro); candidata sem fonte web cai.
export function validarPauta(json: unknown, max: number): { candidatas: CandidataPauta[]; descartadas: number } {
  const { candidatas } = Pauta.parse(json);
  const boas = candidatas.filter((c) => c.fontes.length > 0 && c.fontes.every((f) => ehLinkWeb(f.url)));
  return { candidatas: boas.slice(0, max), descartadas: candidatas.length - boas.length };
}
