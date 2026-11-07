// Menu do painel: fecha ao clicar fora e com Esc. Arquivo à parte por causa da CSP do painel (script-src 'self').
(() => {
  const menu = document.querySelector('.topo .conta');
  if (!menu) return;
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
})();
