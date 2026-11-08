// Fotos do banco redimensionadas pela Vercel (/_vercel/image, configurado em astro.config.mjs): o celular baixa
// a foto na largura da tela, em AVIF/WebP, em vez do arquivo original de 1600px.
export const LARGURAS = [400, 800, 1200, 1600];

const dev = import.meta.env.DEV;

export function imagem(src: string, largura: number, emDev = dev): string {
  if (emDev || !src.startsWith('https://')) return src;
  const w = LARGURAS.find((l) => l >= largura) ?? LARGURAS[LARGURAS.length - 1];
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}

export function srcset(src: string, emDev = dev): string {
  return LARGURAS.map((w) => `${imagem(src, w, emDev)} ${w}w`).join(', ');
}
