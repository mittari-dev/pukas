// Corpo das peças vem do banco em Markdown. micromark, no padrão, escapa HTML cru e descarta
// protocolos perigosos (javascript:), então nada escrito no painel ou pelo robô vira script na página.
import { micromark } from 'micromark';

// Mídia no meio do texto usa a sintaxe de imagem: ![descrição](arquivo). Pela extensão, vídeo e áudio viram player.
// src e alt já chegam escapados pelo micromark, então podem ir direto para os atributos.
const PLAYER: Record<string, 'video' | 'audio'> = { mp4: 'video', webm: 'video', mov: 'video', mp3: 'audio', m4a: 'audio', ogg: 'audio', wav: 'audio' };

export async function renderizarMarkdown(md: string): Promise<string> {
  return micromark(md).replace(/<img src="([^"]*)" alt="([^"]*)" \/>/g, (img, src: string, alt: string) => {
    const tag = PLAYER[src.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''];
    return tag ? `<${tag} controls preload="metadata" src="${src}" aria-label="${alt}"><a href="${src}">${alt || src}</a></${tag}>` : img;
  });
}
