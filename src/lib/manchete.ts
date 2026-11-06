// Marcação de manchete escrita pelo autor no frontmatter:
//   "Direito | nenhum caiu do céu."  → | quebra a linha
//   "Caiu do céu. *Foi luta.*"       → *trecho* sai em destaque (Pau-Brasil)

export interface Trecho {
  texto: string;
  destaque: boolean;
}

export function linhasManchete(titulo: string): Trecho[][] {
  return titulo.split('|').map((linha) =>
    linha
      .trim()
      .split(/(\*[^*]+\*)/)
      .filter(Boolean)
      .map((parte) =>
        parte.startsWith('*') && parte.endsWith('*')
          ? { texto: parte.slice(1, -1), destaque: true }
          : { texto: parte, destaque: false },
      ),
  );
}

export function textoManchete(titulo: string): string {
  return titulo.replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim();
}
