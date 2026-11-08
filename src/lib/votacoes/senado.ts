// API de dados abertos do Senado (legis.senado.leg.br/dadosabertos): processo e votação.
import { lerJson, placar, type Proposicao, type VotacaoNominal } from './congresso';

const API = 'https://legis.senado.leg.br/dadosabertos';

export async function buscarProposicao(sigla: string, numero: number, ano: number, f: typeof fetch): Promise<Proposicao | null> {
  const r = (await lerJson(`${API}/processo?sigla=${encodeURIComponent(sigla)}&numero=${numero}&ano=${ano}`, f)) as { codigoMateria: number; ementa: string }[];
  const p = Array.isArray(r) ? r[0] : undefined;
  if (!p) return null;
  const id = String(p.codigoMateria);
  return { casa: 'senado', sigla, numero, ano, id, ementa: p.ementa.replace(/\s+/g, ' ').trim(), url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${id}` };
}

interface VotacaoSenado {
  codigoSessaoVotacao: string;
  dataSessao: string;
  descricaoVotacao: string;
  votacaoSecreta: string;
  informeLegislativo?: { siglaColegiado?: string };
  votos?: { nomeParlamentar: string; siglaPartidoParlamentar: string; siglaUFParlamentar: string; siglaVotoParlamentar: string }[];
}

export async function votacoesNominais(p: Proposicao, f: typeof fetch): Promise<VotacaoNominal[]> {
  const r = (await lerJson(`${API}/votacao?codigoMateria=${p.id}`, f)) as VotacaoSenado[];
  return (Array.isArray(r) ? r : [])
    .filter((v) => v.votacaoSecreta === 'N' && (v.informeLegislativo?.siglaColegiado ?? 'PLEN') === 'PLEN' && v.votos?.length)
    .map((v) => {
      const votos = v.votos!.map((x) => ({ nome: x.nomeParlamentar, partido: x.siglaPartidoParlamentar ?? '', uf: x.siglaUFParlamentar ?? '', voto: x.siglaVotoParlamentar }));
      // A sessão só traz o dia: o sequencial ordena as do mesmo dia.
      return { idOficial: String(v.codigoSessaoVotacao), data: new Date(`${v.dataSessao}T12:00:00-03:00`), descricao: v.descricaoVotacao, ...placar(votos), votos };
    });
}
