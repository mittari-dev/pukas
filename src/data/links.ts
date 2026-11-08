// Botões fixos da página da bio (/links), no fim. Votação aberta, última edição, notícias e a última obra entram sozinhas antes destes.
// Para uma seção nova (newsletter Trincheira, dossiês, loja), basta uma linha aqui e o texto em i18n/textos.ts.
import type { Chave } from '../i18n/textos';

export interface LinkBio {
  chave: Chave;
  href: string;
}

export const links: LinkBio[] = [
  { chave: 'links.votacoes', href: '/votacoes' },
  { chave: 'links.noticias', href: '/noticias' },
  { chave: 'links.memoria', href: '/newsletter/memoria-operaria' },
  { chave: 'links.cultura', href: '/cultura' },
  { chave: 'links.manifesto', href: '/manifesto' },
];
