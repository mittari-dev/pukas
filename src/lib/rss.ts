import type { Edicao } from './edicoes';
import { caminhoEdicao, formatarNumero } from './formato';
import { textoManchete } from './manchete';

export interface ItemRss {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
}

export function itensRss(edicoes: Edicao[]): ItemRss[] {
  return edicoes.map(({ data: d }) => ({
    title: `${formatarNumero(d.numero)} — ${textoManchete(d.titulo)}`,
    link: `${caminhoEdicao(d.serie, d.numero)}/`,
    pubDate: d.publicadaEm,
    description: d.resumo,
  }));
}
