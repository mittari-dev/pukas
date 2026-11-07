import { describe, expect, test } from 'vitest';
import { cabecalhosAdmin, decidirAcessoAdmin, enderecoNovo, mensagemDeLogin, voltaSegura } from './acesso';

const sessao = (extra: Partial<Parameters<typeof decidirAcessoAdmin>[0]>) => ({ caminho: '/painel', logado: true, aal: 'aal2' as const, temFator: true, ...extra });

describe('decidirAcessoAdmin', () => {
  test('sem login vai para entrar, guardando a volta', () => {
    expect(decidirAcessoAdmin(sessao({ logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'redirecionar', para: '/painel/entrar?volta=%2Fpainel' });
  });

  test('logado sem 2FA cadastrado vai cadastrar', () => {
    expect(decidirAcessoAdmin(sessao({ aal: 'aal1', temFator: false, caminho: '/painel/peca/1' }))).toEqual({ tipo: 'redirecionar', para: '/painel/2fa?volta=%2Fpainel%2Fpeca%2F1' });
  });

  test('logado com 2FA cadastrado mas sem o código vai digitar o código', () => {
    expect(decidirAcessoAdmin(sessao({ aal: 'aal1', temFator: true }))).toEqual({ tipo: 'redirecionar', para: '/painel/2fa?volta=%2Fpainel' });
  });

  test('com 2FA confirmado segue', () => {
    expect(decidirAcessoAdmin(sessao({}))).toEqual({ tipo: 'seguir' });
  });

  test('entrar e 2fa abrem sem aal2', () => {
    expect(decidirAcessoAdmin(sessao({ caminho: '/painel/entrar', logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'seguir' });
    expect(decidirAcessoAdmin(sessao({ caminho: '/painel/2fa', aal: 'aal1', temFator: false }))).toEqual({ tipo: 'seguir' });
  });

  test('2fa sem login volta para entrar', () => {
    expect(decidirAcessoAdmin(sessao({ caminho: '/painel/2fa', logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'redirecionar', para: '/painel/entrar?volta=%2Fpainel' });
  });
});

describe('voltaSegura', () => {
  test('só aceita caminho do painel', () => {
    expect(voltaSegura('/painel/peca/1')).toBe('/painel/peca/1');
    expect(voltaSegura('https://mal.com')).toBe('/painel');
    expect(voltaSegura('//mal.com/painel')).toBe('/painel');
    expect(voltaSegura('/painelx')).toBe('/painel');
    expect(voltaSegura('/manifesto')).toBe('/painel');
    expect(voltaSegura(null)).toBe('/painel');
  });
});

describe('cabecalhosAdmin', () => {
  test('sem cache, fora do Google, sem moldura e com CSP', () => {
    const c = cabecalhosAdmin('https://banco.supabase.co');
    expect(c['Cache-Control']).toBe('private, no-store');
    expect(c['X-Robots-Tag']).toBe('noindex');
    expect(c['X-Frame-Options']).toBe('DENY');
    expect(c['Referrer-Policy']).toBe('same-origin');
    expect(c['Content-Security-Policy']).toContain("default-src 'self'");
    expect(c['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(c['Content-Security-Policy']).toContain('img-src \'self\' https://banco.supabase.co data:');
  });
});

describe('convite', () => {
  test('a página do convite abre sem login (é ela que cria a sessão)', () => {
    expect(decidirAcessoAdmin(sessao({ caminho: '/painel/convite', logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'seguir' });
  });
});

describe('enderecoNovo', () => {
  test('/admin antigo vai para /painel; o resto não muda', () => {
    expect(enderecoNovo('/admin')).toBe('/painel');
    expect(enderecoNovo('/admin/peca/1')).toBe('/painel/peca/1');
    expect(enderecoNovo('/administracao')).toBeNull();
    expect(enderecoNovo('/manifesto')).toBeNull();
  });
});

describe('mensagemDeLogin', () => {
  test('banco fora do ar não parece senha errada', () => {
    expect(mensagemDeLogin({ status: 400, name: 'AuthApiError' })).toBe('E-mail, senha ou código errados.');
    expect(mensagemDeLogin({ status: 0, name: 'AuthRetryableFetchError' })).toBe('O painel não conseguiu falar com o banco agora. Tente de novo em instantes.');
    expect(mensagemDeLogin({ status: 503, name: 'AuthApiError' })).toBe('O painel não conseguiu falar com o banco agora. Tente de novo em instantes.');
  });
});
