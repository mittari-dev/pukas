import { describe, expect, test } from 'vitest';
import { pedirEnvioMidia } from './painel';

// Cliente falso só com o pedaço do Storage que a função usa: devolve o caminho que recebeu.
const cliente = (erro = false) =>
  ({
    storage: {
      from: (balde: string) => ({
        createSignedUploadUrl: async (caminho: string) =>
          erro ? { data: null, error: { message: 'negado' } } : { data: { signedUrl: `https://banco/upload/${balde}/${caminho}?token=t` }, error: null },
      }),
    },
  }) as never;

describe('pedirEnvioMidia', () => {
  test('vídeo mp4: endereço para enviar e endereço público, no balde midias', async () => {
    const r = await pedirEnvioMidia(cliente(), 'video/mp4', 'https://banco');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor.envio).toMatch(/^https:\/\/banco\/upload\/midias\/[0-9a-f-]{36}\.mp4\?token=t$/);
    expect(r.valor.publico).toMatch(/^https:\/\/banco\/storage\/v1\/object\/public\/midias\/[0-9a-f-]{36}\.mp4$/);
  });

  test('tipo fora da lista é recusado antes de ir ao banco', async () => {
    expect(await pedirEnvioMidia(cliente(), 'application/pdf', 'https://banco')).toEqual({ ok: false, erro: 'Mídia precisa ser foto (JPG, PNG, WebP), vídeo (MP4, WebM) ou áudio (MP3, M4A, OGG).' });
  });

  test('banco recusou (sem 2FA ou sem ser editor): erro em português', async () => {
    expect(await pedirEnvioMidia(cliente(true), 'audio/mpeg', 'https://banco')).toEqual({ ok: false, erro: 'Só quem é editor envia mídia.' });
  });
});
