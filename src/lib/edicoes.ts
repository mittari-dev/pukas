// Regras editoriais puras: verdade (fonte, foto, checagem) e linguagem (manchete curta).
// A leitura da coleção fica em carregar.ts, para estas funções serem testáveis sem o Astro.
import { formatarNumero } from './formato';
import { textoManchete } from './manchete';

export const MAX_PALAVRAS_MANCHETE = 8;

export interface Fonte {
  titulo: string;
  instituicao: string;
  url: string;
  tipo: 'primaria' | 'secundaria';
  acessadaEm: Date;
}

export interface Edicao {
  id: string;
  data: {
    serie: string;
    numero: number;
    titulo: string;
    publicadaEm: Date;
    resumo: string;
    legenda?: string;
    foto: { arquivo: unknown; descricao: string; credito?: string; licenca?: string; origem?: string };
    fontes: Fonte[];
    checagem?: { por: string; em: Date };
    correcoes: { em: Date; texto: string }[];
    rascunho: boolean;
  };
}

export function contarPalavras(frase: string): number {
  return textoManchete(frase).split(/\s+/).filter(Boolean).length;
}

export function validarPublicavel(e: Edicao): string[] {
  const { fontes, foto, checagem, titulo } = e.data;
  const problemas: string[] = [];
  if (!fontes.some((f) => f.tipo === 'primaria')) problemas.push('sem fonte primária');
  if (!foto.arquivo) problemas.push('sem foto');
  else if (!foto.descricao?.trim()) problemas.push('foto sem descrição');
  if (!foto.licenca?.trim()) problemas.push('foto sem licença');
  if (!foto.credito?.trim()) problemas.push('foto sem crédito');
  if (!checagem) problemas.push('sem checagem');
  const palavras = contarPalavras(titulo);
  if (palavras > MAX_PALAVRAS_MANCHETE) problemas.push(`manchete com ${palavras} palavras (máx. ${MAX_PALAVRAS_MANCHETE})`);
  return problemas;
}

export function validarNumerosUnicos(edicoes: Edicao[]): void {
  const vistos = new Map<string, string>();
  for (const e of edicoes) {
    const chave = `${e.data.serie}:${e.data.numero}`;
    const anterior = vistos.get(chave);
    if (anterior) throw new Error(`Número repetido: ${formatarNumero(e.data.numero)} (${anterior}, ${e.id})`);
    vistos.set(chave, e.id);
  }
}

export function ordenarFontes(fontes: readonly Fonte[]): Fonte[] {
  return [...fontes.filter((f) => f.tipo === 'primaria'), ...fontes.filter((f) => f.tipo !== 'primaria')];
}

export function edicoesPublicadas(edicoes: Edicao[]): Edicao[] {
  return edicoes.filter((e) => !e.data.rascunho).sort((a, b) => b.data.numero - a.data.numero);
}
