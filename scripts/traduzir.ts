// Gera a tradução para o espanhol das edições e obras que ainda não têm (spec espanhol §5).
// Uso: npm run traduzir            (precisa de ANTHROPIC_API_KEY ou de um perfil `ant auth login`)
// Grava em src/content/es/<colecao>/<mesmo caminho>.mdx com revisado: false. Nada é gravado se a checagem falhar.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parse as lerYaml } from 'yaml';
import { z } from 'zod';
import { problemasDaTraducao } from '../src/lib/traducao.ts';

const MODELO = 'claude-opus-5-5';
const RAIZ = join(import.meta.dirname, '..', 'src', 'content');
const COLECOES = [
  { nome: 'newsletter', origem: join(RAIZ, 'newsletter'), destino: join(RAIZ, 'es', 'newsletter') },
  { nome: 'cultura', origem: join(RAIZ, 'cultura'), destino: join(RAIZ, 'es', 'cultura') },
];

const INSTRUCOES = `Você traduz textos do PUKAS, um veículo de mídia latino-americano, do português do Brasil para o espanhol neutro latino-americano.

- Espanhol neutro: "ustedes", nunca "vosotros". Sem gírias nem regionalismos de um país só, e sem o espanhol da Espanha. O texto precisa soar natural do México à Argentina.
- O tom é de conversa de bar: simples, direto, visceral. Não deixe o texto mais formal, mais acadêmico nem mais suave do que o original.
- Não acrescente, não corte e não suavize nenhum fato. Números, anos, valores, nomes próprios, leis e siglas ficam exatamente como estão, e algarismos continuam algarismos (não escreva números por extenso).
- Nome de lei ou instituição brasileira fica no original; se ajudar o leitor, explique entre parênteses na primeira menção.
- Na manchete, "|" marca quebra de linha e "*trecho*" marca destaque: mantenha a mesma quantidade de cada um, nos lugares equivalentes.
- No corpo, preserve o Markdown (títulos ##, listas, links, negrito) e as quebras de linha, que nos poemas são intencionais.
- Campos ausentes no original ficam ausentes na tradução.`;

const Saida = z.object({
  titulo: z.string(),
  resumo: z.string(),
  legenda: z.string().optional(),
  aviso: z.string().optional(),
  corpo: z.string(),
});
type Texto = z.infer<typeof Saida>;

function listar(pasta: string): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listar(join(pasta, e.name)) : e.name.endsWith('.mdx') ? [join(pasta, e.name)] : [],
  );
}

function lerMdx(caminho: string): { dados: Record<string, unknown>; corpo: string } {
  const m = readFileSync(caminho, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${caminho}: frontmatter não encontrado`);
  return { dados: (lerYaml(m[1]) ?? {}) as Record<string, unknown>, corpo: m[2].trim() };
}

// Strings JSON são escalares YAML válidos entre aspas duplas: escreve o frontmatter sem depender de serializador.
function escreverMdx(caminho: string, dados: Record<string, string | boolean | undefined>, corpo: string) {
  const linhas = Object.entries(dados)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, `---\n${linhas.join('\n')}\n---\n\n${corpo}\n`, 'utf-8');
}

async function traduzir(cliente: Anthropic, original: Texto, aviso?: string): Promise<Texto> {
  const pedido = `Traduza este texto. Devolva o JSON com os mesmos campos.${aviso ? `\n\nNa tentativa anterior a checagem falhou: ${aviso}. Corrija.` : ''}\n\n${JSON.stringify(original, null, 2)}`;
  const resposta = await cliente.beta.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    // Se o modelo recusar por política, o servidor tenta o fallback padrão dentro da mesma chamada.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(Saida) },
    system: INSTRUCOES,
    messages: [{ role: 'user', content: pedido }],
  });
  if (resposta.stop_reason === 'refusal') {
    throw new Error(`o modelo recusou a tradução (${resposta.stop_details?.category ?? 'sem categoria'})`);
  }
  if (!resposta.parsed_output) throw new Error(`resposta sem JSON válido (stop_reason: ${resposta.stop_reason})`);
  return resposta.parsed_output;
}

async function main() {
  const pendentes = COLECOES.flatMap((c) =>
    listar(c.origem).map((origem) => ({ colecao: c.nome, origem, destino: join(c.destino, relative(c.origem, origem)) })),
  ).filter(({ origem, destino, colecao }) => {
    const { dados } = lerMdx(origem);
    if (dados.rascunho === true || dados.traduzir === false) return false;
    if (existsSync(destino)) {
      if (statSync(origem).mtimeMs > statSync(destino).mtimeMs) console.warn(`⚠ ${colecao}: ${relative(RAIZ, destino)} é mais antiga que o original. Revise à mão.`);
      return false;
    }
    return true;
  });

  if (pendentes.length === 0) {
    console.log('Nada para traduzir.');
    return;
  }

  let cliente: Anthropic;
  try {
    cliente = new Anthropic();
  } catch {
    console.warn(`Sem credencial da API do Claude: ${pendentes.length} peça(s) ficaram sem tradução. Configure ANTHROPIC_API_KEY.`);
    return;
  }

  let falhas = 0;
  for (const p of pendentes) {
    const { dados, corpo } = lerMdx(p.origem);
    const original: Texto = {
      titulo: String(dados.titulo),
      resumo: String(dados.resumo),
      legenda: typeof dados.legenda === 'string' ? dados.legenda : undefined,
      aviso: typeof dados.aviso === 'string' ? dados.aviso : undefined,
      corpo,
    };
    try {
      let traducao = await traduzir(cliente, original);
      let problemas = problemasDaTraducao(original, traducao);
      if (problemas.length) {
        traducao = await traduzir(cliente, original, problemas.join('; '));
        problemas = problemasDaTraducao(original, traducao);
      }
      if (problemas.length) throw new Error(`checagem falhou duas vezes: ${problemas.join('; ')}`);
      escreverMdx(p.destino, { titulo: traducao.titulo, resumo: traducao.resumo, legenda: traducao.legenda, aviso: traducao.aviso, revisado: false, modelo: MODELO }, traducao.corpo);
      console.log(`✓ ${relative(RAIZ, p.destino)}`);
    } catch (erro) {
      falhas++;
      const semCredencial = erro instanceof Anthropic.AuthenticationError || (erro instanceof Error && erro.message.includes('Could not resolve authentication'));
      if (semCredencial) {
        console.warn(`Sem credencial válida da API do Claude: ${pendentes.length} peça(s) ficaram sem tradução. Configure ANTHROPIC_API_KEY.`);
        return;
      }
      console.error(`✗ ${relative(RAIZ, p.origem)}: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  }
  if (falhas) process.exitCode = 1;
}

await main();
