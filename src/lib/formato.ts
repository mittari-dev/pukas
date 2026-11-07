import { prefixar, type Idioma } from './idioma';

const MESES: Record<Idioma, string[]> = {
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};


const tresDigitos = (n: number) => String(n).padStart(3, '0');

export function formatarNumero(n: number): string {
  return `Nº ${tresDigitos(n)}`;
}

export function caminhoEdicao(serie: string, n: number, idioma: Idioma = 'pt'): string {
  return prefixar(`/newsletter/${serie}/${tresDigitos(n)}`, idioma);
}

export function caminhoCurto(n: number): string {
  return `/${tresDigitos(n)}`;
}

// UTC: as datas do frontmatter são meia-noite UTC e não podem recuar um dia no fuso do Brasil.
export function formatarData(d: Date, idioma: Idioma = 'pt'): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[idioma][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
