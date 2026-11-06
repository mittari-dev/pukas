// Seções do menu lateral. Seção nova da plataforma (Investigação, Dossiês, Loja) = uma linha aqui.
import type { ItemNavegacao } from '../lib/navegacao';

export const navegacao: ItemNavegacao[] = [
  { rotulo: 'Início', href: '/' },
  { rotulo: 'Memória Operária', href: '/newsletter/memoria-operaria' },
  { rotulo: 'Cultura', href: '/cultura' },
  { rotulo: 'Manifesto', href: '/manifesto' },
  { rotulo: 'Links', href: '/links' },
];
