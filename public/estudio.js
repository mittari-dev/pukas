// Estúdio: "+ Criar nova peça" abre a escolha do tipo como modal. Esc fecha (nativo do <dialog>), clicar fora também.
// Arquivo à parte por causa da CSP do painel (script-src 'self').
(() => {
  const modal = document.getElementById('nova-peca');
  if (!modal || typeof modal.showModal !== 'function') return;
  let origem = null;
  for (const botao of document.querySelectorAll('[data-abrir-nova]')) {
    botao.addEventListener('click', (e) => {
      e.preventDefault();
      origem = botao;
      modal.showModal();
      modal.querySelector('input:checked')?.focus();
    });
  }
  modal.querySelector('[data-fechar-nova]')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.close();
  });
  // Clique no fundo escuro: o alvo é o próprio <dialog>, fora da caixa do formulário.
  modal.addEventListener('click', (e) => {
    if (e.target !== modal) return;
    const r = modal.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) modal.close();
  });
  modal.addEventListener('close', () => origem?.focus());
})();
