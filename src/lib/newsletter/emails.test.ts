import { describe, expect, test } from 'vitest';
import { BOAS_VINDAS, emailConfirmacao, emailEdicao, emailValido, montarBoasVindas, proximoEm } from './emails';

describe('emailValido', () => {
  test('limpa espaços e maiúsculas', () => expect(emailValido('  Maria@Gmail.COM ')).toBe('maria@gmail.com'));
  test('recusa o que não é e-mail', () => {
    for (const ruim of ['', 'maria', 'maria@', '@gmail.com', 'ma ria@gmail.com', 'maria@gmail', `${'a'.repeat(250)}@x.com`]) expect(emailValido(ruim), ruim).toBeNull();
  });
});

describe('boas-vindas', () => {
  const confirmado = new Date('2026-11-08T12:00:00Z');
  test('três e-mails em cada idioma', () => {
    expect(BOAS_VINDAS.pt).toHaveLength(3);
    expect(BOAS_VINDAS.es).toHaveLength(3);
    expect(BOAS_VINDAS.pt[0].assunto).toBe('Pronto, você assinou o PUKAS');
  });
  test('o 2º sai 2 dias depois da confirmação, o 3º 5 dias depois, e depois acaba', () => {
    expect(proximoEm(1, confirmado)?.toISOString()).toBe('2026-11-10T12:00:00.000Z');
    expect(proximoEm(2, confirmado)?.toISOString()).toBe('2026-11-13T12:00:00.000Z');
    expect(proximoEm(3, confirmado)).toBeNull();
  });
  test('todo e-mail leva o link de sair, em HTML e em texto', () => {
    const e = montarBoasVindas('pt', 0, 'https://pukas.lat', 'https://pukas.lat/newsletter/sair?t=abc');
    expect(e.html).toContain('href="https://pukas.lat/newsletter/sair?t=abc"');
    expect(e.text).toContain('https://pukas.lat/newsletter/sair?t=abc');
    expect(e.text).toContain('Aqui é o PUKAS.');
  });
});

describe('confirmação e edição', () => {
  test('confirmação leva o link de confirmar', () => {
    const e = emailConfirmacao('es', 'https://pukas.lat/api/confirmar?t=x');
    expect(e.assunto).toBe('Confirma tu suscripción a PUKAS');
    expect(e.html).toContain('href="https://pukas.lat/api/confirmar?t=x"');
  });
  test('edição: título escapado, corpo já em HTML e link para ler no site', () => {
    const e = emailEdicao('pt', { titulo: 'A greve de <1917>', resumo: 'r', corpoHtml: '<p>texto</p>', link: 'https://pukas.lat/newsletter/x/1' }, 'https://pukas.lat/newsletter/sair?t=a');
    expect(e.assunto).toBe('A greve de <1917>');
    expect(e.html).toContain('A greve de &lt;1917&gt;');
    expect(e.html).toContain('<p>texto</p>');
    expect(e.html).toContain('href="https://pukas.lat/newsletter/x/1"');
  });
});
