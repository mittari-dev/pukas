// Texto da peça em slides para o carrossel e o vídeo (public/carrossel.js desenha). Cada subtítulo (##) abre um
// slide; parágrafo longo é cortado em pedaços de até 45 palavras; no máximo 6 slides de texto.
export interface SlideTexto {
  titulo: string;
  texto: string;
}

const MAX_PALAVRAS = 45;
const MAX_SLIDES = 6;

// Tira a marcação do Markdown: imagem some, link vira o texto, negrito/itálico/código perdem os símbolos.
const limpar = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

export function slidesDoTexto(corpo: string): SlideTexto[] {
  const slides: SlideTexto[] = [];
  let titulo = '';
  for (const bloco of corpo.split(/\n\s*\n/)) {
    const sub = bloco.match(/^#{2,3}\s+(.+)/);
    if (sub) {
      titulo = limpar(sub[1]);
      continue;
    }
    const palavras = limpar(bloco).split(' ').filter(Boolean);
    for (let i = 0; i < palavras.length; i += MAX_PALAVRAS) {
      slides.push({ titulo, texto: palavras.slice(i, i + MAX_PALAVRAS).join(' ') });
      titulo = '';
    }
  }
  return slides.slice(0, MAX_SLIDES);
}
