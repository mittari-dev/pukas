import { prefixar, type Idioma } from './idioma';

const MESES: Record<Idioma, string[]> = {
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

export type Serie = 'memoria-operaria';
// Séries da newsletter. Uma série nova entra aqui (e ganha a página dela no site).
export const SERIES: { id: Serie; nome: string }[] = [{ id: 'memoria-operaria', nome: 'Memória Operária' }];
export const nomeSerie = (id: string | null | undefined) => SERIES.find((s) => s.id === id)?.nome;

const tresDigitos = (n: number) => String(n).padStart(3, '0');

export function formatarNumero(n: number): string {
  return `Nº ${tresDigitos(n)}`;
}

export function caminhoEdicao(serie: Serie, n: number, idioma: Idioma = 'pt'): string {
  return prefixar(`/newsletter/${serie}/${tresDigitos(n)}`, idioma);
}

export function caminhoCurto(n: number): string {
  return `/${tresDigitos(n)}`;
}

// UTC: as datas do frontmatter são meia-noite UTC e não podem recuar um dia no fuso do Brasil.
export function formatarData(d: Date, idioma: Idioma = 'pt'): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[idioma][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
