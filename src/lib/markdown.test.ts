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
