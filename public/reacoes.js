// Curtir e compartilhar (src/components/Reacoes.astro). A página fica no cache da borda, então quem já curtiu
// é lembrado neste aparelho (localStorage); o banco também guarda uma curtida por aparelho.
(() => {
  const CHAVE = 'pukas:curtidas';
  const lidas = () => { try { return JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); } catch { return []; } };
  const marcar = (botao) => {
    botao.setAttribute('aria-pressed', 'true');
    botao.querySelector('[data-rotulo]').hidden = true;
    botao.querySelector('[data-feito]').hidden = false;
  };
  for (const caixa of document.querySelectorAll('[data-reacoes]')) {
    const peca = caixa.dataset.peca;
    const curtir = caixa.querySelector('[data-curtir]');
    curtir.hidden = false;
    if (lidas().includes(peca)) marcar(curtir);
    curtir.addEventListener('click', async () => {
      if (curtir.getAttribute('aria-pressed') === 'true') return;
      marcar(curtir);
      try { localStorage.setItem(CHAVE, JSON.stringify([...lidas(), peca].slice(-500))); } catch {}
      fetch('/api/curtir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ peca }) }).catch(() => {});
    });

    const compartilhar = caixa.querySelector('[data-compartilhar]');
    if (navigator.share) {
      compartilhar.hidden = false;
      compartilhar.addEventListener('click', () => navigator.share({ title: caixa.dataset.titulo, url: caixa.dataset.url }).catch(() => {}));
    }

    const copiar = caixa.querySelector('[data-copiar]');
    if (navigator.clipboard) {
      copiar.hidden = false;
      copiar.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(caixa.dataset.url);
          marcar(copiar);
          setTimeout(() => {
            copiar.setAttribute('aria-pressed', 'false');
            copiar.querySelector('[data-rotulo]').hidden = false;
            copiar.querySelector('[data-feito]').hidden = true;
          }, 2500);
        } catch {}
      });
    }
  }
})();
