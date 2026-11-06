// Tradução guarda só texto. Números, datas, fontes e checagem vêm sempre do original.
import type { Edicao } from './edicoes';
import type { Obra } from './cultura';

export interface Traducao {
  titulo: string;
  resumo: string;
  legenda?: string;
  aviso?: string;
  revisado: boolean;
  modelo?: string;
}

export interface MarcaTraducao {
  traducao?: { revisado: boolean; modelo?: string };
}

// "1.000" (milhar pt/es) conta como 1000; "13º" conta como 13.
export function numerosDoTexto(s: string): string[] {
  return (s.match(/\d{1,3}(?:\.\d{3})+|\d+/g) ?? []).map((n) => n.replace(/\./g, '')).sort();
}

export function validarNumerosTraducao(original: string, traducao: string): string[] {
  const restantes = [...numerosDoTexto(original)];
  const sobram: string[] = [];
  for (const n of numerosDoTexto(traducao)) {
    const i = restantes.indexOf(n);
    if (i >= 0) restantes.splice(i, 1);
    else sobram.push(n);
  }
  return [...(restantes.length ? [`faltam: ${restantes.join(', ')}`] : []), ...(sobram.length ? [`sobram: ${sobram.join(', ')}`] : [])];
}

function marca(trad: Traducao) {
  return { revisado: trad.revisado, modelo: trad.modelo };
}

export function mesclarEdicao(original: Edicao, trad: Traducao): Edicao & MarcaTraducao {
  return {
    ...original,
    data: { ...original.data, titulo: trad.titulo, resumo: trad.resumo, legenda: trad.legenda ?? original.data.legenda },
    traducao: marca(trad),
  };
}

export function mesclarObra(original: Obra, trad: Traducao): Obra & MarcaTraducao {
  return {
    ...original,
    data: { ...original.data, titulo: trad.titulo, resumo: trad.resumo, aviso: trad.aviso ?? original.data.aviso },
    traducao: marca(trad),
  };
}
