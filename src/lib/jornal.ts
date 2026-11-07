// Cabeçalho de jornal da capa: a linha entre fios com data, lugar, ano e preço.
import { formatarData } from './formato';
import type { Idioma } from './idioma';

const FUNDACAO = 2026;
const ROMANOS: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function anoDoJornal(d: Date): string {
  let n = d.getUTCFullYear() - FUNDACAO + 1;
  let s = '';
  for (const [v, r] of ROMANOS) while (n >= v) (s += r), (n -= v);
  return s;
}

export function ultimaPublicacao(...listas: { data: { publicadaEm: Date } }[][]): Date | undefined {
  const datas = listas.flat().map((p) => p.data.publicadaEm.getTime());
  return datas.length ? new Date(Math.max(...datas)) : undefined;
}

const TEXTO = {
  pt: { atualizado: 'ATUALIZADO EM', ano: 'ANO', lugar: 'CABO FRIO — AMÉRICA LATINA', preco: 'GRÁTIS, PASSE ADIANTE' },
  es: { atualizado: 'ACTUALIZADO EL', ano: 'AÑO', lugar: 'CABO FRIO — AMÉRICA LATINA', preco: 'GRATIS, PÁSALO' },
};

// A data é a da última publicação, não a de hoje: a capa fica no cache da borda até alguém publicar.
export function linhaDoCabecalho(ultima: Date | undefined, idioma: Idioma): string[] {
  const t = TEXTO[idioma];
  if (!ultima) return [t.lugar, t.preco];
  return [`${t.atualizado} ${formatarData(ultima, idioma)}`, t.lugar, `${t.ano} ${anoDoJornal(ultima)}`, t.preco];
}
