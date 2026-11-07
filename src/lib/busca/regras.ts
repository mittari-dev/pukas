// Regras do robô de notícias (spec busca §5): quanto custa, se cabe no teto e se é hora de rodar.
// Preço do Claude Sonnet 5.5 e da busca na web, em dólares: por milhão de tokens e por busca.
export const PRECO = { entrada: 2, saida: 10, busca: 0.01 };
const CUSTO_MEDIO_INICIAL = 1.5;

export function custoBrl(uso: { entrada: number; saida: number; buscas: number }, cambio: number): number {
  const dolar = (uso.entrada / 1e6) * PRECO.entrada + (uso.saida / 1e6) * PRECO.saida + uso.buscas * PRECO.busca;
  return Math.round(dolar * cambio * 100) / 100;
}

export function custoMedio(rodadas: { custo_brl: number }[]): number {
  const com = rodadas.map((r) => Number(r.custo_brl)).filter((c) => c > 0).slice(0, 5);
  return com.length ? com.reduce((a, b) => a + b, 0) / com.length : CUSTO_MEDIO_INICIAL;
}

// Só roda se ainda couber uma rodada média dentro do teto do mês.
export function podeRodar(gastoMes: number, teto: number, medio: number): boolean {
  return gastoMes + medio <= teto;
}

const SP = 'America/Sao_Paulo';
const partes = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: SP, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(d).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour), semana: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1, ano: p.year, mes: p.month };
};

// Dia certo, a partir da hora, e só uma vez por dia (a agendada; "rodar agora" não conta).
export function horaDeRodar(agora: Date, cfg: { ativo: boolean; dias: number[]; hora: number }, ultimaAgendadaEm: Date | null): boolean {
  const a = partes(agora);
  if (!cfg.ativo || !cfg.dias.includes(a.semana) || a.hora < cfg.hora) return false;
  return !ultimaAgendadaEm || partes(ultimaAgendadaEm).dia !== a.dia;
}

// Meia-noite do dia 1 em São Paulo (UTC−3, sem horário de verão desde 2019), em ISO.
export function inicioDoMes(agora: Date): string {
  const a = partes(agora);
  return new Date(`${a.ano}-${a.mes}-01T00:00:00-03:00`).toISOString();
}
