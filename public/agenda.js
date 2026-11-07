// Agenda: o item abre por endereço (#item-agenda, o servidor já preenche); aqui ele vira modal.
// Esc fecha (nativo do <dialog>), clicar fora e "Fechar" também. CSP do painel: arquivo à parte.
(() => {
  const modal = document.getElementById('item-agenda');
  if (!modal || typeof modal.showModal !== 'function') return;
  const fechar = () => modal.close();
  if (location.hash === '#item-agenda') {
    modal.showModal();
    modal.querySelector('input[name="titulo"]')?.focus();
  }
  modal.querySelector('[data-fechar-item]')?.addEventListener('click', (e) => {
    e.preventDefault();
    fechar();
  });
  modal.addEventListener('click', (e) => {
    if (e.target !== modal) return;
    const r = modal.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) fechar();
  });
  // Ao fechar, tira o #item-agenda do endereço para recarregar não reabrir.
  modal.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search.replace(/([?&])(item|novo)=[^&]*/g, '$1').replace(/[?&]$/, '')));
})();
