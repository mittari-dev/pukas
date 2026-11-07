// Quem entra no /painel (spec painel §4 e §5). Sem 2FA confirmado (aal2), só abrem o login e o 2FA.
// O banco confere de novo em cada gravação; isto só decide para onde mandar a pessoa.

export interface Sessao {
  caminho: string;
  logado: boolean;
  aal: 'aal1' | 'aal2' | null;
  temFator: boolean;
}

export type Decisao = { tipo: 'seguir' } | { tipo: 'redirecionar'; para: string };

const ENTRAR = '/painel/entrar';
const DOIS_FATORES = '/painel/2fa';
// O link do e-mail de convite: é ele que cria a sessão, então abre sem login.
const CONVITE = '/painel/convite';

// Volta só para dentro do painel: nada de outro site nem de //host.
export function voltaSegura(volta: string | null | undefined): string {
  return volta && /^\/painel(\/|$)/.test(volta) ? volta : '/painel';
}

const com = (destino: string, volta: string) => `${destino}?volta=${encodeURIComponent(voltaSegura(volta))}`;

export function decidirAcessoAdmin({ caminho, logado, aal }: Sessao): Decisao {
  if (caminho === ENTRAR || caminho === CONVITE) return { tipo: 'seguir' };
  if (!logado) return { tipo: 'redirecionar', para: com(ENTRAR, caminho === DOIS_FATORES ? '/painel' : caminho) };
  if (caminho === DOIS_FATORES) return { tipo: 'seguir' };
  if (aal !== 'aal2') return { tipo: 'redirecionar', para: com(DOIS_FATORES, caminho) };
  return { tipo: 'seguir' };
}

export function cabecalhosAdmin(urlBanco: string): Record<string, string> {
  return {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      `img-src 'self' ${urlBanco} data:`,
      `connect-src 'self' ${urlBanco}`,
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };
}

// O painel morava em /admin: links antigos (favoritos, a engrenagem em cache) vão para o mesmo lugar em /painel.
export function enderecoNovo(caminho: string): string | null {
  return /^\/admin(\/|$)/.test(caminho) ? caminho.replace(/^\/admin/, '/painel') : null;
}

// Login: senha errada e banco fora do ar não podem dar a mesma mensagem (o fundador acharia que errou a senha).
// A mensagem de credencial é genérica de propósito: não conta se o e-mail existe.
export function mensagemDeLogin(erro: { status?: number; name?: string }): string {
  const foraDoAr = erro.name === 'AuthRetryableFetchError' || !erro.status || erro.status >= 500;
  return foraDoAr ? 'O painel não conseguiu falar com o banco agora. Tente de novo em instantes.' : 'E-mail, senha ou código errados.';
}
