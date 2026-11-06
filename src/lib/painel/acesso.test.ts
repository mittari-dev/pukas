import { describe, expect, test } from 'vitest';
import { cabecalhosAdmin, decidirAcessoAdmin, voltaSegura } from './acesso';

const sessao = (extra: Partial<Parameters<typeof decidirAcessoAdmin>[0]>) => ({ caminho: '/admin', logado: true, aal: 'aal2' as const, temFator: true, ...extra });

describe('decidirAcessoAdmin', () => {
  test('sem login vai para entrar, guardando a volta', () => {
    expect(decidirAcessoAdmin(sessao({ logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'redirecionar', para: '/admin/entrar?volta=%2Fadmin' });
  });

  test('logado sem 2FA cadastrado vai cadastrar', () => {
    expect(decidirAcessoAdmin(sessao({ aal: 'aal1', temFator: false, caminho: '/admin/peca/1' }))).toEqual({ tipo: 'redirecionar', para: '/admin/2fa?volta=%2Fadmin%2Fpeca%2F1' });
  });

  test('logado com 2FA cadastrado mas sem o código vai digitar o código', () => {
    expect(decidirAcessoAdmin(sessao({ aal: 'aal1', temFator: true }))).toEqual({ tipo: 'redirecionar', para: '/admin/2fa?volta=%2Fadmin' });
  });

  test('com 2FA confirmado segue', () => {
    expect(decidirAcessoAdmin(sessao({}))).toEqual({ tipo: 'seguir' });
  });

  test('entrar e 2fa abrem sem aal2', () => {
    expect(decidirAcessoAdmin(sessao({ caminho: '/admin/entrar', logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'seguir' });
    expect(decidirAcessoAdmin(sessao({ caminho: '/admin/2fa', aal: 'aal1', temFator: false }))).toEqual({ tipo: 'seguir' });
  });

  test('2fa sem login volta para entrar', () => {
    expect(decidirAcessoAdmin(sessao({ caminho: '/admin/2fa', logado: false, aal: null, temFator: false }))).toEqual({ tipo: 'redirecionar', para: '/admin/entrar?volta=%2Fadmin' });
  });
});

describe('voltaSegura', () => {
  test('só aceita caminho do painel', () => {
    expect(voltaSegura('/admin/peca/1')).toBe('/admin/peca/1');
    expect(voltaSegura('https://mal.com')).toBe('/admin');
    expect(voltaSegura('//mal.com/admin')).toBe('/admin');
    expect(voltaSegura('/adminx')).toBe('/admin');
    expect(voltaSegura('/manifesto')).toBe('/admin');
    expect(voltaSegura(null)).toBe('/admin');
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
