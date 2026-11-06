// Botões fixos da página da bio (/links). A última edição entra sozinha, antes destes.
// Para uma seção nova (newsletter Trincheira, dossiês, loja), basta uma linha aqui.
export interface LinkBio {
  rotulo: string;
  href: string;
}

export const links: LinkBio[] = [
  { rotulo: 'Manifesto', href: '/manifesto' },
  { rotulo: 'Todas as edições', href: '/newsletter/memoria-operaria' },
];
