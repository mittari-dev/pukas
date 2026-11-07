// Copiar o link do convite com um toque: no campo ou no botão. Arquivo à parte por causa da CSP do painel (script-src 'self').
(() => {
  const campo = document.getElementById('link-convite');
  const botao = document.querySelector('[data-copiar="link-convite"]');
  const aviso = document.getElementById('link-copiado');
  if (!campo) return;
  const copiar = async () => {
    campo.select();
    try {
      await navigator.clipboard.writeText(campo.value);
    } catch {
      document.execCommand('copy');
    }
    if (aviso) aviso.textContent = 'Link copiado.';
    if (botao) botao.textContent = 'Copiado';
  };
  campo.addEventListener('click', copiar);
  botao?.addEventListener('click', copiar);
})();
