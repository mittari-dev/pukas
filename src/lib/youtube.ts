// Vídeos das matérias (YouTube). O player só carrega no clique, pelo domínio sem cookie do YouTube.
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);

export function idDoYoutube(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!HOSTS.has(u.hostname)) return null;
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : (u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? '');
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export const embedDoYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
export const miniaturaDoYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
