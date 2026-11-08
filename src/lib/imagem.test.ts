import { describe, expect, test } from 'vitest';
import { LARGURAS, imagem, srcset } from './imagem';

const foto = 'https://banco.supabase.co/storage/v1/object/public/fotos/a b.jpg';

describe('imagem', () => {
  test('foto do banco passa pelo redimensionamento da Vercel, na largura pedida', () => {
    expect(imagem(foto, 800, false)).toBe(`/_vercel/image?url=${encodeURIComponent(foto)}&w=800&q=75`);
  });
  test('em desenvolvimento, ou endereço que não é https, fica como está', () => {
    expect(imagem(foto, 800, true)).toBe(foto);
    expect(imagem('/local.jpg', 800, false)).toBe('/local.jpg');
  });
  test('largura fora da lista sobe para a próxima permitida (a Vercel só aceita as configuradas)', () => {
    expect(imagem(foto, 500, false)).toContain('&w=800&');
    expect(imagem(foto, 5000, false)).toContain(`&w=${LARGURAS.at(-1)}&`);
  });
  test('srcset com todas as larguras', () => {
    expect(srcset(foto, false).split(', ')).toHaveLength(LARGURAS.length);
    expect(srcset(foto, false)).toContain('&w=400&q=75 400w');
  });
});
