// Editor de peça do painel. Arquivo à parte por causa da CSP do painel (script-src 'self').
// Rascunho guardado no aparelho: se a conexão cair ou a sessão expirar, o texto não se perde.
(() => {
  const form = document.querySelector('form.editor');
  const contador = document.querySelector('[data-contador]');
  const titulo = document.querySelector('[data-contar]');
  titulo?.addEventListener('input', () => {
    if (contador) contador.textContent = String(titulo.value.replace(/[|*]/g, ' ').split(/\s+/).filter(Boolean).length);
  });
  if (!form) return;
  const chave = form.dataset.chave;
  const ler = () => { try { return JSON.parse(localStorage.getItem(chave) ?? 'null'); } catch { return null; } };
  const gravar = () => {
    const campos = {};
    for (const el of form.querySelectorAll('input[name]:not([type=file]):not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea[name]')) campos[el.name] = el.value;
    try { localStorage.setItem(chave, JSON.stringify({ em: new Date().toISOString(), campos })); } catch {}
  };
  if (form.dataset.limpar) { try { localStorage.removeItem(chave); } catch {} }
  const guardado = ler();
  if (guardado && !form.dataset.limpar && (!form.dataset.atualizado || guardado.em > form.dataset.atualizado)) {
    const aviso = document.querySelector('.restaurar');
    if (aviso) aviso.hidden = false;
    document.querySelector('[data-restaurar]')?.addEventListener('click', () => {
      for (const [nome, valor] of Object.entries(guardado.campos)) {
        const el = form.querySelector(`[name="${CSS.escape(nome)}"]`);
        if (el) el.value = valor;
      }
      if (aviso) aviso.hidden = true;
    });
  }
  let espera;
  form.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(gravar, 500); });
})();
