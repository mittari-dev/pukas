// "Virar rascunho de notícia" (spec consultas §7): o resultado vira uma notícia em rascunho, com os números,
// a metodologia e o placar do plenário. Sempre "de quem votou no PUKAS"; nunca "dos trabalhadores" nem "margem de erro".
import type { Fonte } from '../edicoes';
import type { PecaEntrada } from '../painel/travas';
import type { Proposicao, VotacaoNominal } from './congresso';
import { porcentagens } from './voto';

const CASA = { camara: { frase: 'Na Câmara', nome: 'Câmara dos Deputados' }, senado: { frase: 'No Senado', nome: 'Senado Federal' } };

export function montarRascunho(v: {
  titulo: string;
  proposicao: Proposicao;
  resultado: { a_favor: number; contra: number; nao_sei: number; descartes: Record<string, number> };
  plenario?: VotacaoNominal;
  fontes: Fonte[];
}): PecaEntrada {
  const pct = porcentagens(v.resultado);
  const descartes = Object.entries(v.resultado.descartes);
  const d = descartes.reduce((s, [, n]) => s + n, 0);
  const motivos = descartes.map(([m, n]) => `${m}: ${n}`).join(', ');
  const linhas = [
    `${pct.a_favor}% de quem votou no PUKAS é a favor, ${pct.contra}% contra e ${pct.nao_sei}% não sabe (${pct.total} votos válidos; ${d} descartados${motivos ? `: ${motivos}` : ''}).`,
  ];
  if (v.plenario) linhas.push(`${CASA[v.proposicao.casa].frase}, foram ${v.plenario.sim} votos sim e ${v.plenario.nao} não.`);
  const p = v.proposicao;
  return {
    tipo: 'noticia',
    estado: 'rascunho',
    autoria: 'PUKAS',
    titulo: v.titulo,
    resumo: '',
    corpo: linhas.join('\n\n'),
    fontes: [
      ...v.fontes,
      { titulo: `${p.sigla} ${p.numero}/${p.ano}`, instituicao: CASA[p.casa].nome, url: p.url, tipo: 'primaria', acessadaEm: new Date() },
    ],
    traduzir: true,
  };
}
