// API de dados abertos da Câmara (dadosabertos.camara.leg.br/api/v2).
import { lerJson, placar, type Proposicao, type VotacaoNominal } from './congresso';

const API = 'https://dadosabertos.camara.leg.br/api/v2';

interface Lista<T> {
  dados: T[];
}

export async function buscarProposicao(sigla: string, numero: number, ano: number, f: typeof fetch): Promise<Proposicao | null> {
  const r = (await lerJson(`${API}/proposicoes?siglaTipo=${encodeURIComponent(sigla)}&numero=${numero}&ano=${ano}`, f)) as Lista<{ id: number; ementa: string }>;
  // A mesma sigla/número/ano pode voltar duas vezes (a original e a que volta do Senado): vale a mais antiga.
  const p = [...(r.dados ?? [])].sort((a, b) => a.id - b.id)[0];
  if (!p) return null;
  const id = String(p.id);
  return { casa: 'camara', sigla, numero, ano, id, ementa: p.ementa.replace(/\s+/g, ' ').trim(), url: `https://www.camara.leg.br/propostas-legislativas/${id}` };
}

export async function votacoesNominais(p: Proposicao, f: typeof fetch): Promise<VotacaoNominal[]> {
  const r = (await lerJson(`${API}/proposicoes/${p.id}/votacoes`, f)) as Lista<{ id: string; siglaOrgao: string; dataHoraRegistro: string; descricao: string }>;
  const plenario = (r.dados ?? []).filter((v) => v.siglaOrgao === 'PLEN');
  const nominais: VotacaoNominal[] = [];
  // Votação simbólica não tem lista de votos: só entra a que tem.
  for (const v of plenario) {
    const lista = (await lerJson(`${API}/votacoes/${v.id}/votos`, f)) as Lista<{ tipoVoto: string; deputado_: { nome: string; siglaPartido: string; siglaUf: string } }>;
    const votos = (lista.dados ?? []).map((x) => ({ nome: x.deputado_.nome, partido: x.deputado_.siglaPartido ?? '', uf: x.deputado_.siglaUf ?? '', voto: x.tipoVoto }));
    if (votos.length) nominais.push({ idOficial: v.id, data: new Date(`${v.dataHoraRegistro}-03:00`), descricao: v.descricao, ...placar(votos), votos });
  }
  return nominais;
}
