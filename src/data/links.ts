// Botões fixos da página da bio (/links). A última edição e a última obra entram sozinhas, antes destes.
// Para uma seção nova (newsletter Trincheira, dossiês, loja), basta uma linha aqui e o texto em i18n/textos.ts.
import type { Chave } from '../i18n/textos';

export interface LinkBio {
  chave: Chave;
  href: string;
}

export const links: LinkBio[] = [
  { chave: 'links.manifesto', href: '/manifesto' },
  { chave: 'links.memoria', href: '/newsletter/memoria-operaria' },
  { chave: 'links.cultura', href: '/cultura' },
];
