// Formulário de assinar a newsletter (src/components/FormAssinar.astro). Arquivo à parte por causa do cache da página:
// o aviso vem da URL (?assinatura=...) e é mostrado aqui, e o anti-robô só carrega quando a pessoa mexe no formulário.
(() => {
  const situacao = new URLSearchParams(location.search).get('assinatura');
  for (const form of document.querySelectorAll('[data-assinar]')) {
    const aviso = situacao && form.querySelector(`[data-situacao="${CSS.escape(situacao)}"]`);
    if (aviso) aviso.hidden = false;
    const robo = form.querySelector('.assinar__robo');
    const carregar = () => {
      if (!robo || robo.dataset.pronto) return;
      robo.dataset.pronto = '1';
      robo.classList.add('cf-turnstile');
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      document.head.appendChild(s);
    };
    form.addEventListener('focusin', carregar);
    form.addEventListener('pointerdown', carregar);
  }
})();
