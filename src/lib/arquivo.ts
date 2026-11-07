// Backup do publicado em arquivo/publicado.json (spec painel §7). Saída estável: chaves e listas em ordem fixa,
// sem datas de edição nem ids de usuário, para o diff do Git só mudar quando o conteúdo mudar.
type Linha = Record<string, unknown>;

const FORA = new Set(['atualizado_em', 'atualizado_por', 'criado_por', 'criado_em']);

function limpar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(limpar);
  if (v === null || typeof v !== 'object') return v;
  return Object.fromEntries(
    Object.keys(v)
      .filter((k) => !FORA.has(k))
      .sort()
      .map((k) => [k, limpar((v as Linha)[k])]),
  );
}

const chave = (l: Linha, campos: string[]) => campos.map((c) => String(l[c] ?? '').padStart(c === 'numero' ? 6 : 0, '0')).join('\u0000');
const ordenar = (lista: Linha[], campos: string[]) => [...lista].sort((a, b) => (chave(a, campos) < chave(b, campos) ? -1 : 1));

export function montarArquivo(pecas: Linha[], traducoes: Linha[], correcoes: Linha[]): string {
  return `${JSON.stringify(
    limpar({
      pecas: ordenar(pecas, ['tipo', 'serie', 'numero', 'slug', 'id']),
      traducoes: ordenar(traducoes, ['peca_id', 'idioma']),
      correcoes: ordenar(correcoes, ['peca_id', 'data', 'id']),
    }),
    null,
    2,
  )}\n`;
}
