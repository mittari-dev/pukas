// Gerador de carrossel (1080×1350) e vídeo vertical (1080×1920, sem som) da peça publicada, no editor do painel.
// Os dados vêm do atributo data-slides do modal (src/pages/painel/peca/[id]/index.astro); tudo é desenhado no navegador.
(() => {
  const fonte = document.getElementById('compartilhar');
  if (!fonte?.dataset.slides) return;
  const dados = JSON.parse(fonte.dataset.slides);
  const aviso = document.querySelector('[data-compartilhar-aviso]');
  const dizer = (t) => { if (aviso) aviso.textContent = t; };
  const CAL = '#F1EDE4', TINTA = '#1C1A17', PAU = '#9E2A1E', IPE = '#E0A526', SUAVE = '#5E584E';
  const W = 1080, H = 1350;

  const carregar = (src) => new Promise((ok) => {
    if (!src) return ok(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
  const manchete = (g, px) => {
    g.font = `900 ${px}px "Archivo Variable", "Archivo", "Arial Narrow", Arial, sans-serif`;
    if ('fontStretch' in g) g.fontStretch = 'condensed';
  };
  const texto = (g, px, peso = 500) => {
    g.font = `${peso} ${px}px "Archivo Variable", "Archivo", Arial, sans-serif`;
    if ('fontStretch' in g) g.fontStretch = 'normal';
  };
  const maquina = (g, px) => { g.font = `700 ${px}px "Space Mono", "Courier New", monospace`; };
  const quebrar = (g, t, largura) => {
    const linhas = [];
    let atual = '';
    for (const p of t.split(/\s+/)) {
      const teste = atual ? `${atual} ${p}` : p;
      if (g.measureText(teste).width > largura && atual) { linhas.push(atual); atual = p; } else atual = teste;
    }
    if (atual) linhas.push(atual);
    return linhas;
  };
  // Escreve em linhas a partir de y; devolve o y do fim.
  const escrever = (g, t, x, y, largura, altura) => {
    for (const l of quebrar(g, t, largura)) { y += altura; g.fillText(l, x, y); }
    return y;
  };
  // Maior tamanho (de max a min) em que o texto cabe na caixa; já deixa a fonte aplicada. Devolve a entrelinha.
  const caber = (g, t, largura, alturaMax, max, min, fonte, entrelinha) => {
    let px = max;
    for (; px > min; px -= 2) {
      fonte(g, px);
      if (quebrar(g, t, largura).length * px * entrelinha <= alturaMax) break;
    }
    fonte(g, px);
    return px * entrelinha;
  };

  // Cabeçalho comum: tarja PUKAS e o número do slide.
  function cabeca(g, n, total, escuro = false) {
    manchete(g, 46);
    const w = g.measureText('PUKAS').width + 32;
    g.fillStyle = escuro ? CAL : PAU;
    g.fillRect(80, 70, w, 64);
    g.fillStyle = escuro ? TINTA : CAL;
    g.textBaseline = 'middle';
    g.fillText('PUKAS', 96, 103);
    g.textBaseline = 'alphabetic';
    maquina(g, 28);
    g.fillStyle = escuro ? CAL : TINTA;
    const marca = `${n}/${total}`;
    g.fillText(marca, W - 80 - g.measureText(marca).width, 112);
  }

  async function desenharSlides() {
    await document.fonts?.ready;
    const foto = await carregar(dados.foto);
    const textos = dados.slides;
    const total = 3 + textos.length;
    const slides = [];
    const novo = (escuro = false) => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = escuro ? TINTA : CAL;
      g.fillRect(0, 0, W, H);
      slides.push(c);
      cabeca(g, slides.length, total, escuro);
      return g;
    };

    // 1. Capa: chapéu, foto e manchete.
    let g = novo();
    maquina(g, 32);
    g.fillStyle = PAU;
    g.fillText(dados.chapeu, 80, 230);
    let y = 270;
    if (foto) {
      const fw = 920, fh = 518, e = Math.max(fw / foto.width, fh / foto.height);
      g.drawImage(foto, (foto.width - fw / e) / 2, (foto.height - fh / e) / 2, fw / e, fh / e, 80, y, fw, fh);
      y += fh + 20;
    }
    const titulo = dados.titulo.toUpperCase();
    g.fillStyle = TINTA;
    escrever(g, titulo, 80, y, 920, caber(g, titulo, 920, H - 130 - y, foto ? 110 : 150, 48, manchete, 0.95));
    maquina(g, 26);
    g.fillStyle = SUAVE;
    g.fillText('ARRASTE →', W - 80 - g.measureText('ARRASTE →').width, H - 70);

    // 2. Resumo, com o traço vermelho.
    g = novo();
    g.fillStyle = PAU;
    g.fillRect(80, 260, 96, 10);
    g.fillStyle = TINTA;
    escrever(g, dados.resumo, 80, 300, 920, caber(g, dados.resumo, 920, H - 400, 80, 44, (c, px) => texto(c, px, 700), 1.3));

    // 3. Trechos do texto.
    for (const s of textos) {
      g = novo();
      y = 250;
      if (s.titulo) {
        g.fillStyle = PAU;
        g.fillRect(80, y, 96, 10);
        g.fillStyle = TINTA;
        const sub = s.titulo.toUpperCase();
        y = escrever(g, sub, 80, y + 20, 920, caber(g, sub, 920, 220, 84, 48, manchete, 0.95)) + 40;
      }
      g.fillStyle = TINTA;
      escrever(g, s.texto, 80, y, 920, caber(g, s.texto, 920, H - 110 - y, 68, 40, (c, px) => texto(c, px, 500), 1.35));
    }

    // 4. Final escuro: o link curto e a chamada.
    g = novo(true);
    maquina(g, 34);
    g.fillStyle = IPE;
    g.fillText('LEIA COMPLETO, COM AS FONTES', 80, 420);
    const endereco = dados.link.replace(/^https?:\/\//, '');
    let px = 60;
    do maquina(g, px); while (g.measureText(endereco).width > 920 && (px -= 2) > 24);
    g.fillStyle = CAL;
    g.fillText(endereco, 80, 520);
    manchete(g, 110);
    escrever(g, 'MANDE PRA QUEM TRABALHA COM VOCÊ.', 80, 700, 920, 104);
    return slides;
  }

  const blob = (c, tipo = 'image/png') => new Promise((ok) => c.toBlob(ok, tipo));
  const baixar = (b, nome) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = nome;
    a.click();
  };
  const nomeBase = (dados.link.split('/').pop() || 'pukas').slice(0, 40);

  document.querySelector('[data-carrossel]')?.addEventListener('click', async () => {
    dizer('Montando o carrossel…');
    const slides = await desenharSlides();
    const arquivos = await Promise.all(slides.map(async (c, i) => new File([await blob(c)], `${nomeBase}-${String(i + 1).padStart(2, '0')}.png`, { type: 'image/png' })));
    if (navigator.canShare?.({ files: arquivos })) {
      try {
        await navigator.share({ files: arquivos, title: dados.titulo });
        return dizer('Carrossel pronto.');
      } catch {}
    }
    for (const a of arquivos) baixar(a, a.name);
    dizer(`${arquivos.length} imagens baixadas, na ordem do carrossel.`);
  });

  // Vídeo vertical: os mesmos slides, um depois do outro, no meio de um quadro 1080×1920 escuro.
  // Cada slide fica de 3 a 8 segundos, conforme a quantidade de texto. Grava em tempo real (MediaRecorder).
  document.querySelector('[data-video]')?.addEventListener('click', async () => {
    if (!window.MediaRecorder) return dizer('Este navegador não grava vídeo. Use o Chrome.');
    dizer('Gravando o vídeo… leva o tempo do próprio vídeo; deixe esta aba aberta na tela.');
    const slides = await desenharSlides();
    const palavras = [dados.titulo, dados.resumo, ...dados.slides.map((s) => `${s.titulo} ${s.texto}`), 'leia completo'];
    const tempos = palavras.map((t) => Math.min(8, Math.max(3, t.split(/\s+/).length / 3.5)) * 1000);
    const quadro = document.createElement('canvas');
    quadro.width = 1080;
    quadro.height = 1920;
    const g = quadro.getContext('2d');
    const tipo = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    const gravador = new MediaRecorder(quadro.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 6_000_000 });
    const pedacos = [];
    gravador.ondataavailable = (e) => e.data.size && pedacos.push(e.data);
    const fim = new Promise((ok) => (gravador.onstop = ok));
    gravador.start();
    for (let i = 0; i < slides.length; i++) {
      const ate = performance.now() + tempos[i];
      while (performance.now() < ate) {
        g.fillStyle = TINTA;
        g.fillRect(0, 0, 1080, 1920);
        g.drawImage(slides[i], 0, 285);
        await new Promise((r) => requestAnimationFrame(r));
      }
      dizer(`Gravando… ${i + 1} de ${slides.length}`);
    }
    gravador.stop();
    await fim;
    const ext = tipo?.startsWith('video/mp4') ? 'mp4' : 'webm';
    const video = new File([new Blob(pedacos, { type: tipo })], `${nomeBase}.${ext}`, { type: tipo });
    if (navigator.canShare?.({ files: [video] })) {
      try {
        await navigator.share({ files: [video], title: dados.titulo });
        return dizer('Vídeo pronto.');
      } catch {}
    }
    baixar(video, video.name);
    dizer(ext === 'mp4' ? 'Vídeo baixado (MP4, sem som).' : 'Vídeo baixado em WebM (sem som). Para o Instagram, converta para MP4 ou grave pelo Chrome mais novo.');
  });
})();
