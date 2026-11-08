import { describe, expect, test } from 'vitest';
import { BOAS_VINDAS, emailConfirmacao, emailConvite, emailEdicao, emailSenha, emailValido, montarBoasVindas, proximoEm } from './emails';

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
    expect(e.html).toMatch(/<p style="[^"]+">texto<\/p>/);
    expect(e.html).toContain('href="https://pukas.lat/newsletter/x/1"');
  });
});

describe('desenho do canvas (aprovado em 08/11/2026)', () => {
  const sair = 'https://pukas.lat/api/sair?t=abc';
  test('montado em tabela, com as cores da identidade', () => {
    const e = montarBoasVindas('pt', 0, 'https://pukas.lat', sair);
    expect(e.html).toContain('role="presentation"');
    expect(e.html).toContain('#9E2A1E');
    expect(e.html).toContain('#F1EDE4');
    expect(e.html).toContain('BOAS-VINDAS · 1 DE 3');
  });
  test('confirmação: "Falta um clique." e o botão em maiúscula', () => {
    expect(emailConfirmacao('pt', 'https://x/c').html).toContain('Falta um clique.');
    expect(emailConfirmacao('pt', 'https://x/c').html).toContain('CONFIRMAR ASSINATURA');
    expect(emailConfirmacao('es', 'https://x/c').html).toContain('Falta un clic.');
  });
  test('edição: série, número, foto, ler no site e passe adiante', () => {
    const e = emailEdicao('pt', { titulo: 'T', resumo: 'R', corpoHtml: '<p>x</p><h2>Sub</h2><img src="https://f/a.jpg" alt="a" />', link: 'https://pukas.lat/e', serie: 'Memória Operária', numero: 4, data: '02 NOV 2026', foto: { url: 'https://f/capa.jpg', descricao: 'Capa', credito: 'PUKAS' } }, sair);
    expect(e.html).toContain('MEMÓRIA OPERÁRIA');
    expect(e.html).toContain('Nº 004');
    expect(e.html).toContain('src="https://f/capa.jpg"');
    expect(e.html).toContain('LER NO SITE, COM AS FONTES');
    expect(e.html).toContain('PASSE ADIANTE');
    expect(e.html).toContain('Informação parada não muda nada.');
    // Corpo vindo do Markdown ganha estilo direto na tag (cliente de e-mail ignora CSS de fora).
    expect(e.html).toMatch(/<p style="[^"]+">x<\/p>/);
    expect(e.html).toMatch(/<img style="[^"]*max-width:100%[^"]*" src="https:\/\/f\/a.jpg"/);
  });
});

describe('e-mails da equipe (modelos do Supabase)', () => {
  test('convite e senha levam o endereço do Supabase e não têm link de sair', () => {
    for (const e of [emailConvite(), emailSenha()]) {
      expect(e.html).toContain('href="{{ .ConfirmationURL }}"');
      expect(e.html).not.toContain('SAIR DA LISTA');
      expect(e.html).toContain('NÃO RESPONDA');
    }
    expect(emailConvite().html).toContain('Você foi chamado pra equipe do PUKAS.');
    expect(emailSenha().html).toContain('Trocar a senha do painel');
  });
});
