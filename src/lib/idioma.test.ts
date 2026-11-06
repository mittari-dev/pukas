import { describe, expect, it } from 'vitest';
import { textos } from '../i18n/textos';
import { prefixar, semPrefixo, t } from './idioma';
import { caminhoEdicao, formatarData } from './formato';

describe('textos', () => {
  it('pt e es têm exatamente as mesmas chaves', () => {
    expect(Object.keys(textos.es).sort()).toEqual(Object.keys(textos.pt).sort());
  });

  it('nenhum texto em espanhol está vazio', () => {
    expect(Object.entries(textos.es).filter(([, v]) => !v.trim())).toEqual([]);
  });

  it('t devolve o texto do idioma', () => {
    expect(t('pt', 'nav.inicio')).toBe('Início');
    expect(t('es', 'nav.inicio')).toBe('Inicio');
  });
});

describe('prefixar', () => {
  it.each([
    ['/cultura', 'pt', '/cultura'],
    ['/cultura', 'es', '/es/cultura'],
    ['/', 'es', '/es/'],
    ['/', 'pt', '/'],
  ] as const)('%s em %s → %s', (caminho, idioma, esperado) => {
    expect(prefixar(caminho, idioma)).toBe(esperado);
  });
});

describe('semPrefixo', () => {
  it.each([
    ['/es/cultura/a', { idioma: 'es', caminho: '/cultura/a' }],
    ['/es', { idioma: 'es', caminho: '/' }],
    ['/es/', { idioma: 'es', caminho: '/' }],
    ['/cultura', { idioma: 'pt', caminho: '/cultura' }],
    ['/estatuto', { idioma: 'pt', caminho: '/estatuto' }],
  ] as const)('%s', (pathname, esperado) => {
    expect(semPrefixo(pathname)).toEqual(esperado);
  });
});

describe('formatarData em espanhol', () => {
  it.each([
    ['2026-01-05', '05 ENE 2026'],
    ['2026-04-05', '05 ABR 2026'],
    ['2026-09-05', '05 SEP 2026'],
    ['2026-12-05', '05 DIC 2026'],
  ])('%s → %s', (iso, esperado) => {
    expect(formatarData(new Date(iso), 'es')).toBe(esperado);
  });

  it('pt continua o padrão', () => {
    expect(formatarData(new Date('2026-09-05'))).toBe('05 SET 2026');
  });
});

describe('caminhoEdicao com idioma', () => {
  it('prefixa o espanhol', () => {
    expect(caminhoEdicao('memoria-operaria', 1, 'es')).toBe('/es/newsletter/memoria-operaria/001');
  });
});
