import { describe, expect, test } from 'vitest';
import { embedDoYoutube, idDoYoutube, miniaturaDoYoutube } from './youtube';

describe('youtube', () => {
  test('acha o id nos formatos de link do YouTube', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ?si=x',
    ]) expect(idDoYoutube(url), url).toBe('dQw4w9WgXcQ');
  });
  test('o que não é YouTube volta null', () => {
    for (const url of ['https://vimeo.com/123', 'https://youtube.com.golpe.com/watch?v=dQw4w9WgXcQ', '', 'nada', 'https://www.youtube.com/watch?v=curto']) expect(idDoYoutube(url), url).toBeNull();
  });
  test('embed sem cookie e com play ao abrir; miniatura em alta', () => {
    expect(embedDoYoutube('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
    expect(miniaturaDoYoutube('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});
