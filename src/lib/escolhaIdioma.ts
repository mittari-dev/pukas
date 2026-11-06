// Escolha do idioma no servidor (spec espanhol §4). Puro: o middleware só lê cabeçalhos e aplica o resultado.
import { prefixar, semPrefixo, IDIOMAS, type Idioma } from './idioma.js';

// Países hispânicos: sem língua clara no aparelho, vão para o espanhol.
const PAISES_ES = new Set(['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE']);

// Entradas que sempre existem nos dois idiomas. Páginas de conteúdo nunca são redirecionadas.
const ENTRADAS = new Set(['/', '/links', '/manifesto', '/cultura', '/noticias', '/newsletter/memoria-operaria']);

export interface Sinais {
  cookie?: string;
  acceptLanguage?: string;
  pais?: string;
}

const valido = (v: string | null | undefined): v is Idioma => (IDIOMAS as readonly string[]).includes(v ?? '');

function pelaLingua(acceptLanguage: string): Idioma | undefined {
  const linguas = acceptLanguage
    .split(',')
    .map((parte, ordem) => {
      const [tag, ...params] = parte.trim().toLowerCase().split(';');
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
      return { base: tag.split('-')[0], q: Number.isNaN(q) ? 0 : q, ordem };
    })
    .sort((a, b) => b.q - a.q || a.ordem - b.ordem);
  return linguas.find((l) => valido(l.base))?.base as Idioma | undefined;
}

export function escolherIdioma({ cookie, acceptLanguage, pais }: Sinais): Idioma {
  if (valido(cookie)) return cookie;
  const lingua = acceptLanguage ? pelaLingua(acceptLanguage) : undefined;
  if (lingua) return lingua;
  return pais && PAISES_ES.has(pais.toUpperCase()) ? 'es' : 'pt';
}

export function decidirRedirecionamento(url: URL, sinais: Sinais): { destino?: string; gravarCookie?: Idioma } {
  const pedido = url.searchParams.get('idioma');
  if (valido(pedido)) {
    const resto = new URLSearchParams(url.searchParams);
    resto.delete('idioma');
    const busca = resto.toString();
    return { destino: `${url.pathname}${busca ? `?${busca}` : ''}`, gravarCookie: pedido };
  }

  const { idioma: atual, caminho } = semPrefixo(url.pathname);
  const caminhoLimpo = caminho.replace(/(.)\/$/, '$1');
  if (!ENTRADAS.has(caminhoLimpo)) return {};

  // Quem abriu um link /es sem ter escolhido idioma fica onde está: só o cookie tira alguém do espanhol.
  if (atual === 'es' && !valido(sinais.cookie)) return {};

  const desejado = escolherIdioma(sinais);
  return desejado === atual ? {} : { destino: prefixar(caminhoLimpo, desejado) };
}
