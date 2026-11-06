import { textos, type Chave } from '../i18n/textos.js';

export const IDIOMAS = ['pt', 'es'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const LANG: Record<Idioma, string> = { pt: 'pt-BR', es: 'es-419' };

export function t(idioma: Idioma, chave: Chave): string {
  return textos[idioma][chave];
}

// pt não tem prefixo; es usa /es e o mesmo caminho.
export function prefixar(caminho: string, idioma: Idioma): string {
  return idioma === 'es' ? `/es${caminho}` : caminho;
}

export function semPrefixo(pathname: string): { idioma: Idioma; caminho: string } {
  if (pathname === '/es' || pathname.startsWith('/es/')) return { idioma: 'es', caminho: pathname.slice(3) || '/' };
  return { idioma: 'pt', caminho: pathname };
}
