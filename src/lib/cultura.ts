// Regras da seção Cultura. Ficção não exige fonte; imagem de capa exige crédito e licença.
import type { Fonte } from './edicoes';
import { formatarNumero } from './formato';

export const TIPOS = ['conto', 'cena', 'poema', 'ensaio'] as const;
export type TipoObra = (typeof TIPOS)[number];

export interface Obra {
  id: string;
  data: {
    tipo: TipoObra;
    numero: number;
    titulo: string;
    resumo: string;
    publicadaEm: Date;
    autoria: string;
    video?: string;
    aviso?: string;
    capa?: { arquivo: unknown; descricao: string; credito?: string; licenca?: string; origem?: string };
    fontes: Fonte[];
    rascunho: boolean;
  };
}

export function validarObra(o: Obra): string[] {
  const { capa } = o.data;
  if (!capa) return [];
  const problemas: string[] = [];
  if (!capa.licenca?.trim()) problemas.push('capa sem licença');
  if (!capa.credito?.trim()) problemas.push('capa sem crédito');
  return problemas;
}

export function validarNumerosObras(obras: Obra[]): void {
  const vistos = new Map<number, string>();
  for (const o of obras) {
    const anterior = vistos.get(o.data.numero);
    if (anterior) throw new Error(`Número repetido na Cultura: ${formatarNumero(o.data.numero)} (${anterior}, ${o.id})`);
    vistos.set(o.data.numero, o.id);
  }
}

export function obrasPublicadas(obras: Obra[]): Obra[] {
  return obras.filter((o) => !o.data.rascunho).sort((a, b) => b.data.numero - a.data.numero);
}

export function rotuloTipo(tipo: TipoObra): string {
  return tipo.toUpperCase();
}
