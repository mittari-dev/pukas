import { describe, expect, it } from 'vitest';
import { decidirRedirecionamento, escolherIdioma } from './escolhaIdioma';

describe('escolherIdioma', () => {
  it('o cookie ganha de tudo', () => {
    expect(escolherIdioma({ cookie: 'pt', acceptLanguage: 'es-CL,es;q=0.9', pais: 'CL' })).toBe('pt');
  });

  it('usa a primeira língua suportada do aparelho, respeitando o peso', () => {
    expect(escolherIdioma({ acceptLanguage: 'es-CL,es;q=0.9,pt;q=0.8' })).toBe('es');
    expect(escolherIdioma({ acceptLanguage: 'en-US,en;q=0.9,pt-BR;q=0.8,es;q=0.7' })).toBe('pt');
    expect(escolherIdioma({ acceptLanguage: 'pt;q=0.5,es;q=0.9' })).toBe('es');
  });

  it('português de Portugal também é português', () => {
    expect(escolherIdioma({ acceptLanguage: 'pt-PT' })).toBe('pt');
  });

  it('sem língua suportada, decide pelo país', () => {
    expect(escolherIdioma({ acceptLanguage: 'en-US', pais: 'CL' })).toBe('es');
    expect(escolherIdioma({ acceptLanguage: 'en-US', pais: 'MX' })).toBe('es');
    expect(escolherIdioma({ acceptLanguage: 'en-US', pais: 'US' })).toBe('pt');
    expect(escolherIdioma({ pais: 'BR' })).toBe('pt');
  });

  it('ignora cookie inválido', () => {
    expect(escolherIdioma({ cookie: 'fr', pais: 'AR' })).toBe('es');
  });

  it('sem nada, português', () => {
    expect(escolherIdioma({})).toBe('pt');
  });
});

const url = (caminho: string) => new URL(`https://pukas.lat${caminho}`);

describe('decidirRedirecionamento', () => {
  it('leva quem fala espanhol da entrada pt para a entrada es', () => {
    expect(decidirRedirecionamento(url('/links'), { acceptLanguage: 'es-CL' })).toEqual({ destino: '/es/links' });
    expect(decidirRedirecionamento(url('/'), { pais: 'AR' })).toEqual({ destino: '/es/' });
  });

  it('leva quem escolheu pt de uma entrada es para a pt', () => {
    expect(decidirRedirecionamento(url('/es/links'), { cookie: 'pt' })).toEqual({ destino: '/links' });
  });

  it('não mexe em quem já está no idioma certo', () => {
    expect(decidirRedirecionamento(url('/links'), { pais: 'BR' })).toEqual({});
    expect(decidirRedirecionamento(url('/es/cultura'), { acceptLanguage: 'es' })).toEqual({});
  });

  it('sem cookie, não tira ninguém de um link /es compartilhado', () => {
    expect(decidirRedirecionamento(url('/es/links'), { pais: 'BR' })).toEqual({});
  });

  it('não redireciona páginas de conteúdo (só as entradas)', () => {
    expect(decidirRedirecionamento(url('/cultura/a-marmita'), { acceptLanguage: 'es' })).toEqual({});
    expect(decidirRedirecionamento(url('/es/newsletter/memoria-operaria/001'), { cookie: 'pt' })).toEqual({});
  });

  it('?idioma= grava o cookie e limpa a URL', () => {
    expect(decidirRedirecionamento(url('/es/cultura/a?idioma=es'), {})).toEqual({ destino: '/es/cultura/a', gravarCookie: 'es' });
    expect(decidirRedirecionamento(url('/links?idioma=pt&x=1'), { acceptLanguage: 'es' })).toEqual({ destino: '/links?x=1', gravarCookie: 'pt' });
  });

  it('ignora ?idioma= inválido', () => {
    expect(decidirRedirecionamento(url('/links?idioma=fr'), { pais: 'BR' })).toEqual({});
  });
});
