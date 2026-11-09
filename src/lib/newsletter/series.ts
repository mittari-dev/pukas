// Assinatura por série da newsletter. Lista vazia quer dizer "todas", inclusive as que nascerem depois:
// é o caso de quem assinou antes de haver escolha, de quem marcou todas e de quando só existe uma série.
export function seriesEscolhidas(pedidas: string[], ativas: string[]): string[] {
  const escolhidas = [...new Set(pedidas.filter((s) => ativas.includes(s)))];
  return escolhidas.length === 0 || escolhidas.length === ativas.length ? [] : escolhidas;
}

export const recebe = (series: string[], serie: string) => series.length === 0 || series.includes(serie);
