// Modal de compartilhar do editor do painel (src/pages/painel/peca/[id]/index.astro). Arquivo à parte por causa
// da CSP do painel (script-src 'self'). Abre sozinho depois de publicar; o botão "Compartilhar" abre de novo.
(() => {
  const modal = document.getElementById('compartilhar');
  if (!modal || !modal.showModal) return;
  const aviso = modal.querySelector('[data-compartilhar-aviso]');
  const dizer = (t) => { if (aviso) aviso.textContent = t; };
  const { link, titulo, chapeu, foto } = modal.dataset;

  document.querySelector('[data-abrir-compartilhar]')?.addEventListener('click', () => modal.showModal());
  if (modal.dataset.abrir) modal.showModal();

  modal.querySelector('[data-copiar-link]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link);
      dizer('Link copiado.');
    } catch {
      dizer(`Copie o link: ${link}`);
    }
  });

  // Quebra o título em linhas que caibam na largura.
  const linhas = (ctx, texto, largura) => {
    const saida = [];
    let atual = '';
    for (const palavra of texto.split(/\s+/)) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(teste).width > largura && atual) {
        saida.push(atual);
        atual = palavra;
      } else atual = teste;
    }
    if (atual) saida.push(atual);
    return saida;
  };

  const carregar = (src) => new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });

  // Imagem do story, 1080×1920: papel Cal, tarja PUKAS, chapéu, foto, título e o link no rodapé escuro.
  async function desenharStory() {
    const CAL = '#F1EDE4', TINTA = '#1C1A17', PAU = '#9E2A1E';
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    const g = c.getContext('2d');
    await document.fonts?.ready;
    g.fillStyle = CAL;
    g.fillRect(0, 0, 1080, 1920);
    const manchete = (px) => {
      g.font = `900 ${px}px "Archivo Variable", "Archivo", "Arial Narrow", Arial, sans-serif`;
      if ('fontStretch' in g) g.fontStretch = 'condensed';
    };

    // Tarja do tamanho da palavra, com a fonte que tiver carregado.
    manchete(84);
    g.fillStyle = PAU;
    g.fillRect(80, 120, g.measureText('PUKAS').width + 56, 110);
    g.fillStyle = CAL;
    g.textBaseline = 'middle';
    g.fillText('PUKAS', 108, 178);

    g.fillStyle = PAU;
    g.font = '700 34px "Space Mono", "Courier New", monospace';
    g.textBaseline = 'alphabetic';
    g.fillText(chapeu || 'PUKAS', 80, 320);

    let y = 360;
    const img = foto ? await carregar(foto) : null;
    if (img) {
      const w = 920, h = 518;
      const escala = Math.max(w / img.width, h / img.height);
      const sw = w / escala, sh = h / escala;
      g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 80, y, w, h);
      y += h + 90;
    } else y += 60;

    manchete(img ? 104 : 150);
    g.fillStyle = TINTA;
    const tamanho = img ? 104 : 150;
    for (const l of linhas(g, (titulo || '').toUpperCase(), 920).slice(0, img ? 6 : 8)) {
      y += tamanho * 0.92;
      g.fillText(l, 80, y);
    }

    g.fillStyle = TINTA;
    g.fillRect(0, 1600, 1080, 320);
    g.fillStyle = '#E0A526';
    g.font = '700 34px "Space Mono", "Courier New", monospace';
    g.fillText('LEIA EM', 80, 1700);
    // O link diminui até caber na largura (código de link curto pode ser comprido).
    g.fillStyle = CAL;
    const endereco = (link || '').replace(/^https?:\/\//, '');
    let px = 52;
    do g.font = `700 ${px}px "Space Mono", "Courier New", monospace`;
    while (g.measureText(endereco).width > 920 && (px -= 2) > 22);
    g.fillText(endereco, 80, 1790);

    return new Promise((ok) => c.toBlob(ok, 'image/png'));
  }

  modal.querySelector('[data-story]')?.addEventListener('click', async () => {
    dizer('Montando a imagem…');
    const blob = await desenharStory();
    if (!blob) return dizer('Não deu para montar a imagem.');
    const arquivo = new File([blob], 'pukas-story.png', { type: 'image/png' });
    try { await navigator.clipboard.writeText(link); } catch {}
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: titulo });
        dizer('Link copiado: cole no adesivo de link do story.');
        return;
      } catch {}
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pukas-story.png';
    a.click();
    dizer('Imagem baixada e link copiado: poste a imagem no story e cole o link no adesivo de link.');
  });
})();
