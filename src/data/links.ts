// Botões fixos da página da bio (/links), no fim. A última notícia, a votação aberta e a última newsletter entram sozinhas antes destes.
// Para uma seção nova (newsletter Trincheira, dossiês, loja), basta uma linha aqui e o texto em i18n/textos.ts.
import type { Chave } from '../i18n/textos';

export interface LinkBio {
  chave: Chave;
  href: string;
}

export const links: LinkBio[] = [
  { chave: 'links.manifesto', href: '/manifesto' },
  { chave: 'links.edicoes', href: '/newsletter' },
  { chave: 'links.noticias', href: '/noticias' },
];
