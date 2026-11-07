// Setas de voltar e avançar pelas páginas recém-visitadas (o histórico do navegador).
// Arquivo à parte, não inline: o painel tem CSP script-src 'self'. Sem JavaScript as setas ficam escondidas.
(() => {
  const setas = document.querySelector('.setas');
  if (!setas) return;
  const botoes = setas.querySelectorAll('[data-ir]');
  const atualizar = () => {
    const nav = window.navigation;
    for (const b of botoes) {
      const ir = Number(b.dataset.ir);
      // Navigation API (Chrome, Edge) sabe se há para onde ir; nos outros, voltar depende do tamanho do histórico.
      b.disabled = nav ? (ir < 0 ? !nav.canGoBack : !nav.canGoForward) : ir < 0 && history.length < 2;
    }
  };
  for (const b of botoes) b.addEventListener('click', () => history.go(Number(b.dataset.ir)));
  setas.hidden = false;
  atualizar();
  // Voltar pelo cache do navegador (bfcache) não recarrega a página: recalcula.
  addEventListener('pageshow', atualizar);
})();
