// A CSP do painel é script-src 'self': script embutido no HTML não roda. O Astro embute scripts pequenos
// no build (não no dev, por isso só um teste olhando os arquivos pega). Todo script do painel vem de public/.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const arquivos = (pasta: string): string[] =>
  readdirSync(pasta, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? arquivos(join(pasta, e.name)) : e.name.endsWith('.astro') ? [join(pasta, e.name)] : []));

describe('CSP do painel', () => {
  test('nenhum <script> embutido nas páginas do painel nem nos componentes que elas usam', () => {
    const lista = [...arquivos('src/pages/painel'), 'src/layouts/Painel.astro', 'src/components/layout/Setas.astro'];
    const embutidos = lista.filter((f) => [...readFileSync(f, 'utf-8').matchAll(/<script\b([^>]*)>/g)].some((m) => !/\bsrc=/.test(m[1])));
    expect(embutidos).toEqual([]);
  });
});
