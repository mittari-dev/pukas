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

// Mídia no meio do texto: pede um endereço de envio ao painel, sobe o arquivo direto para o Storage
// e põe ![descrição](endereço) no ponto do texto onde estava o cursor.
(() => {
  const botao = document.querySelector('[data-midia-inserir]');
  const arquivo = document.querySelector('[data-midia-arquivo]');
  const descricao = document.querySelector('[data-midia-descricao]');
  const aviso = document.querySelector('[data-midia-aviso]');
  const corpo = document.querySelector('#corpo');
  if (!botao || !arquivo || !corpo) return;
  const dizer = (texto) => { if (aviso) { aviso.textContent = texto; aviso.hidden = !texto; } };
  // Clicar no botão tira o foco do texto: guarda onde o cursor estava.
  let ponto = corpo.value.length;
  const marcar = () => { ponto = corpo.selectionStart; };
  corpo.addEventListener('keyup', marcar);
  corpo.addEventListener('click', marcar);
  corpo.addEventListener('blur', marcar);
  botao.addEventListener('click', async () => {
    const f = arquivo.files?.[0];
    if (!f) return dizer('Escolha um arquivo primeiro.');
    if (f.size > 50 * 1024 * 1024) return dizer('O arquivo passa de 50 MB. Diminua e tente de novo.');
    botao.disabled = true;
    dizer('Enviando…');
    try {
      const pedido = await fetch('/painel/midia', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tipo: f.type }) });
      const r = await pedido.json().catch(() => ({ erro: 'Sessão expirou? Recarregue a página.' }));
      if (!pedido.ok) return dizer(r.erro ?? 'Não deu para enviar.');
      const envio = await fetch(r.envio, { method: 'PUT', headers: { 'content-type': f.type }, body: f });
      if (!envio.ok) return dizer('Não deu para enviar o arquivo. Tente de novo.');
      const texto = (descricao?.value ?? '').replace(/[[\]]/g, '').trim();
      const antes = corpo.value.slice(0, ponto).replace(/\s*$/, '');
      const depois = corpo.value.slice(ponto).replace(/^\s*/, '');
      const linha = `![${texto}](${r.publico})`;
      corpo.value = [antes, linha, depois].filter(Boolean).join('\n\n');
      ponto = (antes ? antes.length + 2 : 0) + linha.length;
      corpo.dispatchEvent(new Event('input', { bubbles: true }));
      arquivo.value = '';
      if (descricao) descricao.value = '';
      dizer(texto ? 'Mídia inserida no texto. Salve para guardar.' : 'Mídia inserida. Falta a descrição: escreva entre os colchetes [ ] da linha nova. Salve para guardar.');
    } catch {
      dizer('Sem conexão. Tente de novo.');
    } finally {
      botao.disabled = false;
    }
  });
})();
