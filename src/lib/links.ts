// Links curtos (pukas.lat/ir/<código>) para descrição de vídeo, bio e grupo. Só levam para dentro do site.
import { caminhoEdicao } from './formato';

export const codigoValido = (c: string) => /^[a-z0-9][a-z0-9-]{0,39}$/.test(c);

// Caminho do próprio site. "//x" e "/\x" o navegador lê como outro domínio; espaço e caractere de controle
// também ficam de fora, porque o navegador apaga TAB e quebra de linha e "/<TAB>/x" viraria "//x".
export const destinoValido = (d: string) => /^\/(?![/\\])[^\s\x00-\x1f]*$/.test(d);

export function sugerirCodigo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/º/g, 'o')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

export function caminhoPublico(p: { tipo: string; id: string; slug: string | null; serie?: string | null; numero?: number | null }): string {
  const s = p.slug ?? p.id;
  if (p.tipo === 'newsletter' && p.serie && p.numero) return caminhoEdicao(p.serie, p.numero);
  if (p.tipo === 'pagina') return `/${s}`;
  return `/${{ noticia: 'noticias', cultura: 'cultura', votacao: 'votacoes' }[p.tipo] ?? 'noticias'}/${s}`;
}
