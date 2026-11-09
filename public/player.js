// Vídeo das matérias (src/views/Materia.astro): o YouTube só carrega quando a pessoa clica, pelo domínio sem cookie.
// Sem JavaScript, o link abre o vídeo no YouTube.
(() => {
  for (const player of document.querySelectorAll('[data-player]')) {
    const abrir = player.querySelector('.player__abrir');
    abrir?.addEventListener('click', (e) => {
      e.preventDefault();
      const quadro = document.createElement('iframe');
      quadro.src = player.dataset.embed;
      quadro.title = 'YouTube';
      quadro.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      quadro.allowFullscreen = true;
      abrir.replaceWith(quadro);
    });
  }
})();
