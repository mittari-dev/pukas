// /privacidade nasce em rascunho (o fundador revisa e publica pelo painel); no ar, aparece no site.
import { describe, expect, test } from 'vitest';
import { clienteServico } from '../banco/ajuda';

const base = process.env.RETRATO_URL;

describe.skipIf(!base)('/privacidade', () => {
  test('em rascunho dá 404; publicada dá 200 com o texto', async () => {
    const db = clienteServico();
    const { data } = await db.from('pecas').select('estado').eq('tipo', 'pagina').eq('slug', 'privacidade').single();
    expect(data?.estado).toBe('rascunho');
    expect((await fetch(new URL('/privacidade', base))).status).toBe(404);

    expect((await db.from('pecas').update({ estado: 'publicada' }).eq('tipo', 'pagina').eq('slug', 'privacidade')).error).toBeNull();
    const r = await fetch(new URL('/privacidade', base));
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('O que guardamos');
    expect(await (await fetch(new URL('/', base))).text()).toContain('href="/privacidade"');
  });
});
