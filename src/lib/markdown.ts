// Corpo das peças vem do banco em Markdown. micromark, no padrão, escapa HTML cru e descarta
// protocolos perigosos (javascript:), então nada escrito no painel ou pelo robô vira script na página.
import { micromark } from 'micromark';

export async function renderizarMarkdown(md: string): Promise<string> {
  return micromark(md);
}
