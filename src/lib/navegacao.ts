export interface ItemNavegacao {
  rotulo: string;
  href: string;
}

// Seção da página atual: o item cujo href é a rota ou um prefixo dela, por segmento inteiro.
export function secaoAtiva(pathname: string, itens: readonly ItemNavegacao[]): string | undefined {
  const caminho = pathname.replace(/\/+$/, '') || '/';
  return itens.find((i) => caminho === i.href || caminho.startsWith(`${i.href}/`))?.href;
}
