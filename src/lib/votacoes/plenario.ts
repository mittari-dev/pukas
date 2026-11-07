// O que o robô do plenário faz hoje (spec consultas §6). Puro: o script busca nas casas e grava; isto só decide.
import type { Proposicao, VotacaoNominal } from './congresso';

export interface VotacaoDoRobo {
  id: string;
  proposicao: Proposicao;
  publicada_em: string;
  fecha_em: string | null;
  // id_oficial das nominais que já estão no banco.
  gravadas: string[];
}

const UM_DIA = 864e5;
// Requerimento (urgência, adiamento, quebra de interstício) também é nominal, mas não é o voto da proposição.
const ehRequerimento = (n: VotacaoNominal) => /requerimento/i.test(n.descricao);

// fechar: votações que fecham hoje, pela nominal ou pelo prazo (o banco só antecipa fecha_em, nunca adia; e o site
// renova o cache). Votação fora do mapa (a casa não respondeu) fica como está até amanhã.
export function planoDoDia(votacoes: VotacaoDoRobo[], achadas: Map<string, VotacaoNominal[]>, agora: Date): { gravar: { votacaoId: string; votacao: VotacaoNominal }[]; fechar: string[] } {
  const gravar: { votacaoId: string; votacao: VotacaoNominal }[] = [];
  const fechar: string[] = [];
  for (const v of votacoes) {
    const nominais = achadas.get(v.id);
    if (!nominais) continue;
    const publicada = new Date(v.publicada_em);
    const depois = nominais.filter((n) => n.data >= publicada);
    for (const n of depois) if (!v.gravadas.includes(n.idOficial)) gravar.push({ votacaoId: v.id, votacao: n });
    const fecha = v.fecha_em ? new Date(v.fecha_em) : null;
    const aberta = !fecha || agora <= fecha;
    const prazoVenceuHoje = fecha !== null && agora > fecha && agora.getTime() - fecha.getTime() <= UM_DIA;
    if ((aberta && depois.some((n) => !ehRequerimento(n))) || prazoVenceuHoje) fechar.push(v.id);
  }
  return { gravar, fechar };
}
