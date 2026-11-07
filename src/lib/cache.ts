// Páginas públicas ficam no cache da borda do Vercel até alguém publicar: publicar invalida as etiquetas.
// stale-while-revalidate longo: se o banco cair, quem visita continua vendo a última versão.
export function cabecalhosPublicos(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Vercel-CDN-Cache-Control': 'max-age=31536000, stale-while-revalidate=31536000',
  };
}

export function deveGuardar(metodo: string, caminho: string, status: number): boolean {
  if (metodo !== 'GET' || status !== 200) return false;
  return !/^\/(admin|painel|api)(\/|$)/.test(caminho);
}

// Etiquetas: cada peça tem a sua; capa, listas, RSS e /links são "indice"; "tudo" pega o site inteiro.
export const etiquetaPeca = (id: string) => `peca:${id}`;
export const ETIQUETA_INDICE = 'indice';
export const ETIQUETA_TUDO = 'tudo';
// Página de uma peça: a etiqueta dela (pelo uuid) e "indice", porque ela mostra links para as vizinhas.
export const etiquetasDaPeca = (p: { id: string; pecaId?: string }) => [etiquetaPeca(p.pecaId ?? p.id), ETIQUETA_INDICE];
