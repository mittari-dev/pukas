// Câmara e Senado por uma porta só: o painel e o robô do plenário não precisam saber de qual casa é.
import * as camara from './camara';
import * as senado from './senado';

export type Casa = 'camara' | 'senado';

export interface Proposicao {
  casa: Casa;
  sigla: string;
  numero: number;
  ano: number;
  id: string;
  ementa: string;
  url: string;
}

export interface VotoParlamentar {
  nome: string;
  partido: string;
  uf: string;
  voto: string;
}

export interface VotacaoNominal {
  idOficial: string;
  data: Date;
  descricao: string;
  sim: number;
  nao: number;
  abstencao: number;
  outros: number;
  votos: VotoParlamentar[];
}

export class ErroCongresso extends Error {}

// Lê JSON de uma API aberta; status fora de 2xx ou rede caída viram ErroCongresso.
export async function lerJson(url: string, f: typeof fetch): Promise<unknown> {
  let r: Response;
  try {
    r = await f(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new ErroCongresso(`sem resposta de ${url}: ${(e as Error).message}`);
  }
  if (!r.ok) throw new ErroCongresso(`${url} respondeu ${r.status}`);
  try {
    return await r.json();
  } catch {
    throw new ErroCongresso(`${url} não devolveu JSON`);
  }
}

// Placar contado da própria lista, para a soma bater sempre com os nomes mostrados.
export function placar(votos: VotoParlamentar[]): Pick<VotacaoNominal, 'sim' | 'nao' | 'abstencao' | 'outros'> {
  const c = { sim: 0, nao: 0, abstencao: 0, outros: 0 };
  for (const { voto } of votos) {
    const v = voto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    if (v === 'sim') c.sim++;
    else if (v === 'nao') c.nao++;
    else if (v === 'abstencao') c.abstencao++;
    else c.outros++;
  }
  return c;
}

export function buscarProposicao(casa: Casa, sigla: string, numero: number, ano: number, f: typeof fetch = fetch): Promise<Proposicao | null> {
  return (casa === 'camara' ? camara : senado).buscarProposicao(sigla, numero, ano, f);
}

export async function votacoesNominais(p: Proposicao, desde: Date, f: typeof fetch = fetch): Promise<VotacaoNominal[]> {
  const vs = await (p.casa === 'camara' ? camara : senado).votacoesNominais(p, f);
  return vs.filter((v) => v.data >= desde).sort((a, b) => a.data.getTime() - b.data.getTime());
}
