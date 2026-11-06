import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./tokens.css', import.meta.url)), 'utf-8');
const hexes = [...css.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toUpperCase());

describe('tokens.css', () => {
  it('define exatamente as 5 cores da paleta v2.0', () => {
    expect(new Set(hexes)).toEqual(new Set(['#9E2A1E', '#1C1A17', '#F1EDE4', '#E0A526', '#1A452C']));
  });

  it.each(['--pau-brasil', '--tinta', '--cal', '--ipe', '--verde-mata'])('declara %s', (nome) => {
    expect(css).toContain(`${nome}:`);
  });
});
