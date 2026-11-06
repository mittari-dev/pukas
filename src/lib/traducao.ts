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

const conta = (s: string, c: string) => s.split(c).length - 1;

// Checagem que o script de tradução roda antes de gravar: marcações da manchete e números do texto inteiro.
export function problemasDaTraducao(original: { titulo: string; corpo: string }, traducao: { titulo: string; corpo: string }): string[] {
  const marcas = ['|', '*']
    .filter((c) => conta(original.titulo, c) !== conta(traducao.titulo, c))
    .map((c) => `manchete com ${conta(traducao.titulo, c)} "${c}" (original tem ${conta(original.titulo, c)})`);
  return [...marcas, ...validarNumerosTraducao(`${original.titulo}\n${original.corpo}`, `${traducao.titulo}\n${traducao.corpo}`)];
}

interface ComTexto {
  id: string;
  body?: string;
  data: { titulo: string };
}

// Junta original e tradução pelo id. Trava se algum número da manchete ou do corpo divergir.
export function aplicarTraducoes<O extends ComTexto, R>(
  originais: O[],
  traducoes: { id: string; body?: string; data: Traducao }[],
  mesclar: (original: O, traducao: Traducao) => R,
): R[] {
  const porId = new Map(traducoes.map((t) => [t.id, t]));
  const erros: string[] = [];
  const resultado: R[] = [];
  for (const o of originais) {
    const t = porId.get(o.id);
    if (!t) continue;
    const problemas = validarNumerosTraducao(`${o.data.titulo}\n${o.body ?? ''}`, `${t.data.titulo}\n${t.body ?? ''}`);
    if (problemas.length) erros.push(`${o.id}: ${problemas.join('; ')}`);
    else resultado.push(mesclar(o, t.data));
  }
  if (erros.length) throw new Error(`Tradução com números diferentes do original:\n${erros.join('\n')}`);
  return resultado;
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
