import { describe, expect, test } from 'vitest';
import { FOTO_MAX_BYTES, enviarFoto } from './painel';

describe('enviarFoto', () => {
  test('limite abaixo dos 4,5 MB que o Vercel aceita por requisição (a foto vai junto com o formulário)', async () => {
    expect(FOTO_MAX_BYTES).toBeLessThanOrEqual(4 * 1024 * 1024);
    const grande = new File([new Uint8Array(FOTO_MAX_BYTES + 1)], 'f.jpg', { type: 'image/jpeg' });
    expect(await enviarFoto({} as never, grande)).toEqual({ ok: false, erro: 'A foto passa de 4 MB. Diminua e envie de novo.' });
  });
});
