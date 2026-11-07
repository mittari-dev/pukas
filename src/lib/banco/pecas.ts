// Linhas do Supabase viram os tipos que as views já usam (Edicao, Obra). As consultas ficam em consultas.ts.
import type { Edicao, Fonte } from '../edicoes';
import type { Obra, TipoObra } from '../cultura';
import type { MarcaTraducao } from '../traducao';
import type { EstadoPeca, TipoPeca } from '../painel/travas';

export interface LinhaTraducao {
  idioma: string;
  titulo: string | null;
  resumo: string | null;
  legenda: string | null;
  aviso: string | null;
  corpo: string | null;
  revisado: boolean;
  modelo: string | null;
  estado: 'pendente' | 'pronta' | 'erro';
  erro?: string | null;
}

export interface LinhaPeca {
  id: string;
  tipo: TipoPeca;
  serie: string | null;
  numero: number | null;
  slug: string | null;
  subtipo: string | null;
  autoria: string;
  titulo: string;
  resumo: string;
  legenda: string | null;
  aviso: string | null;
  corpo: string;
  foto_caminho: string | null;
  foto_descricao: string | null;
  foto_credito: string | null;
  foto_licenca: string | null;
  foto_origem: string | null;
  video: string | null;
  fontes: (Omit<Fonte, 'acessadaEm'> & { acessadaEm: string })[];
  checagem: { por: string; em: string } | null;
  traduzir: boolean;
  estado: EstadoPeca;
  publicada_em: string | null;
  correcoes?: { data: string; texto: string }[];
  traducoes?: LinhaTraducao[];
}

export type ComCorpo<T> = T & MarcaTraducao & { body?: string };

export const urlFoto = (base: string, caminho: string) => `${base}/storage/v1/object/public/fotos/${caminho}`;

const opcional = <T>(v: T | null): T | undefined => v ?? undefined;
const fontes = (l: LinhaPeca): Fonte[] => l.fontes.map((f) => ({ ...f, acessadaEm: new Date(f.acessadaEm) }));
const foto = (l: LinhaPeca, base: string) =>
  l.foto_caminho
    ? { arquivo: urlFoto(base, l.foto_caminho), descricao: l.foto_descricao ?? '', credito: opcional(l.foto_credito), licenca: opcional(l.foto_licenca), origem: opcional(l.foto_origem) }
    : undefined;

export function paraEdicao(l: LinhaPeca, base: string): ComCorpo<Edicao> {
  return {
    id: l.id,
    body: l.corpo,
    data: {
      serie: l.serie as Edicao['data']['serie'],
      numero: l.numero ?? 0,
      titulo: l.titulo,
      publicadaEm: new Date(l.publicada_em ?? Date.now()),
      resumo: l.resumo,
      legenda: opcional(l.legenda),
      foto: foto(l, base) ?? { arquivo: '', descricao: '' },
      fontes: fontes(l),
      checagem: l.checagem ? { por: l.checagem.por, em: new Date(l.checagem.em) } : undefined,
      correcoes: [...(l.correcoes ?? [])].sort((a, b) => a.data.localeCompare(b.data)).map((c) => ({ em: new Date(c.data), texto: c.texto })),
      rascunho: l.estado !== 'publicada',
    },
  };
}

export function paraObra(l: LinhaPeca, base: string): ComCorpo<Obra> {
  return {
    id: l.slug ?? l.id,
    body: l.corpo,
    data: {
      tipo: l.subtipo as TipoObra,
      numero: l.numero ?? 0,
      titulo: l.titulo,
      resumo: l.resumo,
      publicadaEm: new Date(l.publicada_em ?? Date.now()),
      autoria: l.autoria,
      video: opcional(l.video),
      aviso: opcional(l.aviso),
      capa: foto(l, base),
      fontes: fontes(l),
      rascunho: l.estado !== 'publicada',
      traduzir: l.traduzir,
    },
  };
}

// Texto em espanhol por cima do original; números, datas, fontes e foto ficam do original.
export function emEspanhol<T extends { data: { titulo: string; resumo: string; legenda?: string; aviso?: string } }>(
  peca: ComCorpo<T>,
  l: LinhaPeca,
): ComCorpo<T> | null {
  const t = l.traducoes?.find((x) => x.idioma === 'es' && x.estado === 'pronta');
  if (!t) return null;
  return {
    ...peca,
    body: t.corpo ?? '',
    data: {
      ...peca.data,
      titulo: t.titulo ?? peca.data.titulo,
      resumo: t.resumo ?? peca.data.resumo,
      ...(t.legenda ? { legenda: t.legenda } : {}),
      ...(t.aviso ? { aviso: t.aviso } : {}),
    },
    traducao: { revisado: t.revisado, modelo: opcional(t.modelo) },
  };
}
