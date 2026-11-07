// Regras da agenda editorial (spec agenda §2 a §4): datas, situação do item e espaços do ritmo da casa.
// Datas como 'YYYY-MM-DD'; contas em UTC ao meio-dia, para nenhuma virada de fuso mudar o dia.
import type { EstadoPeca } from './painel/travas';

export type Dia = string;
export type SituacaoManual = 'ideia' | 'escrevendo' | 'pronta';
export type Situacao = SituacaoManual | 'em_revisao' | 'publicada';

const paraData = (d: Dia) => new Date(`${d}T12:00:00Z`);
const paraDia = (d: Date): Dia => d.toISOString().slice(0, 10);
const somar = (d: Dia, dias: number): Dia => {
  const x = paraData(d);
  x.setUTCDate(x.getUTCDate() + dias);
  return paraDia(x);
};
// 1 = segunda … 7 = domingo, como no ritmo.
export const diaDaSemana = (d: Dia) => paraData(d).getUTCDay() || 7;

export function hojeEmSaoPaulo(agora: Date): Dia {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
}

export function semanaDe(dia: Dia): Dia[] {
  const segunda = somar(dia, 1 - diaDaSemana(dia));
  return Array.from({ length: 7 }, (_, i) => somar(segunda, i));
}

export function gradeDoMes(dia: Dia): Dia[][] {
  const mes = dia.slice(0, 7);
  const semanas: Dia[][] = [];
  for (let s = semanaDe(`${mes}-01`); s.some((d) => d.startsWith(mes)); s = semanaDe(somar(s[0], 7))) semanas.push(s);
  return semanas;
}

const PELA_PECA: Record<EstadoPeca, Situacao> = { rascunho: 'escrevendo', em_revisao: 'em_revisao', publicada: 'publicada', rejeitada: 'ideia' };

// Com peça ligada, a situação é a da peça (não se grava, para nunca sair de sincronia); sem ela, a manual.
export function situacaoDoItem(item: { situacao: SituacaoManual; peca_id: string | null }, estadoDaPeca?: EstadoPeca): Situacao {
  return item.peca_id && estadoDaPeca ? PELA_PECA[estadoDaPeca] : item.situacao;
}

export function atrasado(dia: Dia, situacao: Situacao, hoje: Dia): boolean {
  return dia < hoje && situacao !== 'publicada';
}

interface Compromisso {
  dia_semana: number;
  tipo: string;
  serie: string | null;
  rotulo: string | null;
  ativo: boolean;
}

// Espaço reservado do ritmo: some quando um item do mesmo tipo (e série) ocupa o dia.
export function espacosDoRitmo(dias: Dia[], ritmo: Compromisso[], itens: { dia: Dia; tipo: string; serie: string | null }[]) {
  return dias.flatMap((dia) =>
    ritmo
      .filter((r) => r.ativo && r.dia_semana === diaDaSemana(dia))
      .filter((r) => !itens.some((i) => i.dia === dia && i.tipo === r.tipo && (r.tipo !== 'newsletter' || i.serie === r.serie)))
      .map((r) => ({ dia, tipo: r.tipo, serie: r.serie, rotulo: r.rotulo })),
  );
}
