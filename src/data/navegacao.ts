// Seções do menu. Seção nova da plataforma (Investigação, Dossiês, Loja) = uma linha aqui e o texto em i18n/textos.ts.
// Os href são do português; o menu prefixa /es quando a página está em espanhol.
import type { Chave } from '../i18n/textos';

export const navegacao: { chave: Chave; href: string }[] = [
  { chave: 'nav.inicio', href: '/' },
  { chave: 'nav.memoria', href: '/newsletter/memoria-operaria' },
  { chave: 'nav.cultura', href: '/cultura' },
  { chave: 'nav.manifesto', href: '/manifesto' },
  { chave: 'nav.links', href: '/links' },
];
