import { describe, expect, test } from 'vitest';
import { renderizarMarkdown } from './markdown';

describe('renderizarMarkdown', () => {
  test('títulos, negrito e links', async () => {
    const html = await renderizarMarkdown('## Título\n\ntexto **forte** e [fonte](https://planalto.gov.br)');
    expect(html).toContain('<h2>Título</h2>');
    expect(html).toContain('<strong>forte</strong>');
    expect(html).toContain('<a href="https://planalto.gov.br">fonte</a>');
  });

  test('HTML cru sai como texto, não como tag', async () => {
    const html = await renderizarMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });

  test('link javascript: perde o destino', async () => {
    const html = await renderizarMarkdown('[clique](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  test('quebras de linha dos poemas ficam (barra invertida ou dois espaços)', async () => {
    expect(await renderizarMarkdown('verso um  \nverso dois')).toContain('<br />');
  });
});

describe('mídia no meio do texto', () => {
  const base = 'https://banco.supabase.co/storage/v1/object/public/midias';

  test('foto vira figura com a descrição', async () => {
    const html = await renderizarMarkdown(`primeiro\n\n![Greve no ABC](${base}/a.jpg)\n\nsegundo`);
    expect(html).toContain(`<img src="${base}/a.jpg" alt="Greve no ABC" />`);
  });

  test('vídeo vira player, com a descrição como texto alternativo', async () => {
    const html = await renderizarMarkdown(`![Assembleia](${base}/b.mp4)`);
    expect(html).toContain(`<video controls preload="metadata" src="${base}/b.mp4" aria-label="Assembleia">`);
    expect(html).not.toContain('<img');
  });

  test('áudio vira player', async () => {
    const html = await renderizarMarkdown(`![Entrevista](${base}/c.mp3)`);
    expect(html).toContain(`<audio controls preload="metadata" src="${base}/c.mp3" aria-label="Entrevista">`);
  });

  test('a ordem do texto fica: foto, vídeo e áudio em parágrafos diferentes', async () => {
    const html = await renderizarMarkdown(`um\n\n![f](${base}/1.png)\n\ndois\n\n![v](${base}/2.webm)\n\ntrês\n\n![a](${base}/3.m4a)`);
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<video'));
    expect(html.indexOf('<video')).toBeLessThan(html.indexOf('<audio'));
  });

  test('descrição com aspas não quebra o atributo', async () => {
    const html = await renderizarMarkdown(`![a "b" <c>](${base}/d.mp4)`);
    expect(html).toContain('aria-label="a &quot;b&quot; &lt;c&gt;"');
  });
});
