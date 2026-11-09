// Gerador de carrossel (1080×1350) da peça publicada, no modal de compartilhar do editor do painel.
// Esqueleto fixo do manual de identidade (2e): logo no canto, contador 01/06, fio + editoria + endereço no rodapé.
// Muda só o miolo, entre 4 módulos: capa, texto corrido, citação, chamada final. Linguagem de cartaz: Pau-Brasil
// dominando, manchete pesada, foto em 3 tons (Tinta, Pau-Brasil, Cal) e grão.
// Os dados vêm do atributo data-slides do modal (src/pages/painel/peca/[id]/index.astro); tudo é desenhado no navegador.
(() => {
  const fonte = document.getElementById('compartilhar');
  if (!fonte?.dataset.slides) return;
  const dados = JSON.parse(fonte.dataset.slides);
  const aviso = document.querySelector('[data-compartilhar-aviso]');
  const dizer = (t) => { if (aviso) aviso.textContent = t; };
  const CAL = '#F1EDE4', TINTA = '#1C1A17', PAU = '#9E2A1E', IPE = '#E0A526';
  const W = 1080, H = 1350, M = 56, LARG = W - 2 * M;
  const TOPO = 190, BASE = H - 130; // miolo entre o cabeçalho e o rodapé

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
    if ('fontStretch' in g) g.fontStretch = 'extra-condensed';
  };
  const texto = (g, px, peso = 600) => {
    g.font = `${peso} ${px}px "Archivo Variable", "Archivo", Arial, sans-serif`;
    if ('fontStretch' in g) g.fontStretch = 'normal';
  };
  const maquina = (g, px, peso = 700) => { g.font = `${peso} ${px}px "Space Mono", "Courier New", monospace`; };
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
  const alturaDe = (g, t, largura, entrelinha) => quebrar(g, t, largura).length * entrelinha;

  // Grão de papel: um ladrilho de ruído desenhado uma vez e repetido por cima de cada slide.
  let grao;
  const granular = (g, forca) => {
    if (!grao) {
      const c = document.createElement('canvas');
      c.width = c.height = 180;
      const x = c.getContext('2d');
      const d = x.createImageData(180, 180);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() < 0.5 ? 0 : 255;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = Math.random() * 255;
      }
      x.putImageData(d, 0, 0);
      grao = c;
    }
    g.save();
    g.globalAlpha = forca;
    g.fillStyle = g.createPattern(grao, 'repeat');
    g.fillRect(0, 0, W, H);
    g.restore();
  };

  // Foto em 3 tons, como serigrafia: sombra Tinta, meio-tom Pau-Brasil, luz Cal. Se o navegador não deixar ler
  // os pixels (foto de outro domínio sem CORS), vai em preto e branco com o vermelho multiplicado por cima.
  const RGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const TONS = [RGB(TINTA), RGB(PAU), RGB(CAL)];
  function fotoEmTres(g, img, x, y, w, h) {
    const e = Math.max(w / img.width, h / img.height);
    const sw = w / e, sh = h / e;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = c.getContext('2d');
    t.filter = 'grayscale(1) contrast(1.35)';
    t.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
    try {
      const d = t.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const l = d.data[i] / 255;
        const [r, gg, b] = TONS[l < 0.38 ? 0 : l < 0.72 ? 1 : 2];
        d.data[i] = r; d.data[i + 1] = gg; d.data[i + 2] = b;
      }
      t.putImageData(d, 0, 0);
    } catch {
      t.globalCompositeOperation = 'multiply';
      t.fillStyle = PAU;
      t.fillRect(0, 0, w, h);
    }
    g.drawImage(c, x, y);
  }

  // Esqueleto que nunca muda. `fundo` define as cores do logo, do contador e do rodapé.
  function esqueleto(g, n, total, fundo) {
    const claro = fundo === CAL;
    g.fillStyle = fundo;
    g.fillRect(0, 0, W, H);
    manchete(g, 64);
    const w = g.measureText('PUKAS').width + 36;
    g.fillStyle = fundo === PAU ? CAL : PAU;
    g.fillRect(M, M, w, 72);
    g.fillStyle = fundo === PAU ? PAU : CAL;
    g.textBaseline = 'middle';
    g.fillText('PUKAS', M + 18, M + 39);
    g.textBaseline = 'alphabetic';
    const tinta = claro ? TINTA : fundo === TINTA ? IPE : CAL;
    maquina(g, 34);
    g.fillStyle = tinta;
    const marca = `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
    g.fillText(marca, W - M - g.measureText(marca).width, M + 50);
    g.fillRect(M, H - 104, LARG, 4);
    maquina(g, 28, 400);
    g.fillText(dados.chapeu, M, H - 56);
    g.fillText('PUKAS.LAT', W - M - g.measureText('PUKAS.LAT').width, H - 56);
  }

  async function desenharSlides() {
    await document.fonts?.ready;
    const foto = await carregar(dados.foto);
    const total = 3 + dados.slides.length;
    const slides = [];
    const novo = (fundo) => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d');
      slides.push({ c, g, fundo });
      esqueleto(g, slides.length, total, fundo);
      return g;
    };

    // Capa: Pau-Brasil, a foto em 3 tons em cima e a manchete pesada embaixo (Cal com foto, Tinta sem foto).
    let g = novo(PAU);
    const titulo = dados.titulo.toUpperCase();
    if (foto) {
      fotoEmTres(g, foto, M, TOPO - 30, LARG, 640);
      g.fillStyle = CAL;
      const linha = caber(g, titulo, LARG, BASE - 30 - (TOPO + 640), 150, 56, manchete, 0.9);
      escrever(g, titulo, M, BASE - 30 - alturaDe(g, titulo, LARG, linha), LARG, linha);
    } else {
      g.fillStyle = TINTA;
      const linha = caber(g, titulo, LARG, BASE - TOPO - 20, 230, 64, manchete, 0.88);
      escrever(g, titulo, M, BASE - 20 - alturaDe(g, titulo, LARG, linha), LARG, linha);
    }

    // Texto corrido, em Cal. O resumo abre maior e em negrito; os trechos podem ter subtítulo em Pau-Brasil.
    g = novo(CAL);
    g.fillStyle = TINTA;
    escrever(g, dados.resumo, M, TOPO, LARG, caber(g, dados.resumo, LARG, BASE - TOPO - 40, 84, 44, (c, px) => texto(c, px, 800), 1.22));

    for (const s of dados.slides) {
      if (s.citacao) {
        // Citação: fundo Tinta, a frase em Ipê, quem disse em Cal. A pessoa é a autora da manchete.
        g = novo(TINTA);
        const frase = s.texto.toUpperCase();
        g.fillStyle = IPE;
        const fim = escrever(g, frase, M, TOPO + 40, LARG, caber(g, frase, LARG, BASE - TOPO - 200, 150, 56, manchete, 0.92));
        if (s.autor) {
          maquina(g, 32);
          g.fillStyle = CAL;
          escrever(g, `— ${s.autor.toUpperCase()}`, M, fim + 30, LARG, 44);
        }
        continue;
      }
      g = novo(CAL);
      let y = TOPO;
      if (s.titulo) {
        const sub = s.titulo.toUpperCase();
        g.fillStyle = PAU;
        y = escrever(g, sub, M, y, LARG, caber(g, sub, LARG, 260, 120, 56, manchete, 0.9)) + 36;
      }
      g.fillStyle = TINTA;
      escrever(g, s.texto, M, y, LARG, caber(g, s.texto, LARG, BASE - 30 - y, 72, 40, (c, px) => texto(c, px, 600), 1.3));
    }

    // Chamada final: Pau-Brasil, a frase em Ipê e o link curto em Cal.
    g = novo(PAU);
    const chamada = 'MANDE PRA QUEM TRABALHA COM VOCÊ.';
    g.fillStyle = IPE;
    escrever(g, chamada, M, TOPO + 20, LARG, caber(g, chamada, LARG, 700, 220, 80, manchete, 0.88));
    maquina(g, 30);
    g.fillStyle = CAL;
    g.fillText('LEIA COMPLETO, COM AS FONTES:', M, BASE - 110);
    const endereco = dados.link.replace(/^https?:\/\//, '');
    let px = 56;
    do maquina(g, px); while (g.measureText(endereco).width > LARG && (px -= 2) > 24);
    g.fillText(endereco, M, BASE - 40);

    // Grão por cima de tudo (mais forte no vermelho, de leve no papel).
    for (const s of slides) granular(s.g, s.fundo === CAL ? 0.06 : 0.1);
    return slides.map((s) => s.c);
  }

  const blob = (c) => new Promise((ok) => c.toBlob(ok, 'image/png'));
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
})();
