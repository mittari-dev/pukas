import type { Edicao } from './edicoes';
import { caminhoEdicao, formatarNumero } from './formato';
import { textoManchete } from './manchete';
import type { Idioma } from './idioma';

export interface ItemRss {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
}

export function itensRss(edicoes: Edicao[], idioma: Idioma = 'pt'): ItemRss[] {
  return edicoes.map(({ data: d }) => ({
    title: `${formatarNumero(d.numero)} — ${textoManchete(d.titulo)}`,
    link: `${caminhoEdicao(d.serie, d.numero, idioma)}/`,
    pubDate: d.publicadaEm,
    description: d.resumo,
  }));
}
