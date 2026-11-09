// Matérias (vídeo de quinta e dossiê): o banco exige o vídeo do YouTube, além de fonte e checagem.
import { describe, expect, test } from 'vitest';
import { clienteAnonimo, clienteServico, pecaValida } from './ajuda';

const servico = clienteServico();

describe('matéria', () => {
  test('completa publica e o público lê', async () => {
    const m = pecaValida('materia');
    const { error } = await servico.from('pecas').insert(m);
    expect(error).toBeNull();
    const { data } = await clienteAnonimo().from('pecas').select('slug').eq('slug', m.slug as string).single();
    expect(data?.slug).toBe(m.slug);
  });
  test('sem vídeo ou com vídeo de fora do YouTube, o banco recusa', async () => {
    for (const video of [null, 'https://vimeo.com/123']) {
      const { error } = await servico.from('pecas').insert({ ...pecaValida('materia'), video });
      expect(error?.message, String(video)).toContain('sem vídeo do YouTube');
    }
  });
  test('subtipo só quinta ou dossiê', async () => {
    const { error } = await servico.from('pecas').insert({ ...pecaValida('materia'), subtipo: 'poema' });
    expect(error).not.toBeNull();
  });
});
