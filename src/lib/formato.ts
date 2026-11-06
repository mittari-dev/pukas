const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export type Serie = 'memoria-operaria';

const tresDigitos = (n: number) => String(n).padStart(3, '0');

export function formatarNumero(n: number): string {
  return `Nº ${tresDigitos(n)}`;
}

export function caminhoEdicao(serie: Serie, n: number): string {
  return `/newsletter/${serie}/${tresDigitos(n)}`;
}

export function caminhoCurto(n: number): string {
  return `/${tresDigitos(n)}`;
}

// UTC: as datas do frontmatter são meia-noite UTC e não podem recuar um dia no fuso do Brasil.
export function formatarData(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
