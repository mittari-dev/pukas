// Séries da newsletter (tabela series). O editor cria pelo painel; o site mostra as ligadas.
import type { Idioma } from './idioma';

export interface LinhaSerie {
  slug: string;
  nome: string;
  nome_es: string;
  descricao: string;
  descricao_es: string;
  selo: string;
  selo_es: string;
  ativa: boolean;
}

export interface Serie {
  slug: string;
  nome: string;
  descricao: string;
  selo: string;
}

export function serieNoIdioma(l: LinhaSerie, idioma: Idioma): Serie {
  return idioma === 'es'
    ? { slug: l.slug, nome: l.nome_es, descricao: l.descricao_es, selo: l.selo_es }
    : { slug: l.slug, nome: l.nome, descricao: l.descricao, selo: l.selo };
}

export const nomeDaSerie = (series: { slug: string; nome: string }[], slug: string | null | undefined) => series.find((s) => s.slug === slug)?.nome;

// Endereço a partir do nome: "Memória Operária" → "memoria-operaria".
export function slugDaSerie(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export const slugValido = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 60;
