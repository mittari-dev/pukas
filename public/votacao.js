// Copiar o comprovante com um toque. Sem texto novo: o botão só ganha um ✓ depois de copiar.
(() => {
  const codigo = document.getElementById('comprovante');
  const botao = document.querySelector('[data-copiar="comprovante"]');
  if (!codigo || !botao) return;
  botao.addEventListener('click', async () => {
    const texto = codigo.textContent.replace('#', '').trim();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const r = document.createRange();
      r.selectNodeContents(codigo);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      document.execCommand('copy');
    }
    if (!botao.textContent.endsWith('✓')) botao.textContent += ' ✓';
  });
})();
