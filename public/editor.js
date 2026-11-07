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

// Foto do celular costuma passar de 4 MB: diminui no próprio aparelho (lado maior de 2400 px, JPEG) antes de enviar.
(() => {
  const campo = document.querySelector('[data-foto]');
  const aviso = document.querySelector('[data-foto-aviso]');
  if (!campo || !window.DataTransfer || !window.createImageBitmap) return;
  const MAX = 4 * 1024 * 1024;
  const LADO = 2400;
  const dizer = (texto) => { if (aviso) { aviso.textContent = texto; aviso.hidden = !texto; } };
  campo.addEventListener('change', async () => {
    const arquivo = campo.files?.[0];
    dizer('');
    if (!arquivo || arquivo.size <= MAX * 0.75) return;
    try {
      dizer('Diminuindo a foto…');
      const imagem = await createImageBitmap(arquivo);
      const escala = Math.min(1, LADO / Math.max(imagem.width, imagem.height));
      const tela = document.createElement('canvas');
      tela.width = Math.round(imagem.width * escala);
      tela.height = Math.round(imagem.height * escala);
      tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height);
      const menor = await new Promise((ok) => tela.toBlob(ok, 'image/jpeg', 0.85));
      if (!menor || menor.size > MAX) return dizer('A foto continua grande demais. Escolha outra ou diminua antes.');
      const lista = new DataTransfer();
      lista.items.add(new File([menor], arquivo.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
      campo.files = lista.files;
      dizer(`Foto diminuída: ${(arquivo.size / 1048576).toFixed(1)} MB → ${(menor.size / 1048576).toFixed(1)} MB.`);
    } catch {
      dizer('Não deu para diminuir a foto aqui. Se passar de 4 MB, diminua antes de enviar.');
    }
  });
})();
