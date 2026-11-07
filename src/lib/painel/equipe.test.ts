import { describe, expect, test } from 'vitest';
import { lerConvite, lerSenhaNova, mudancaNaEquipe } from './equipe';

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.append(k, v);
  return f;
};

describe('lerConvite', () => {
  test('e-mail, nome e papel válidos', () => {
    expect(lerConvite(form({ email: ' Ana@Exemplo.org ', nome: ' Ana ', papel: 'revisor' }))).toEqual({ ok: true, valor: { email: 'ana@exemplo.org', nome: 'Ana', papel: 'revisor' } });
  });

  test('e-mail inválido ou papel inventado não passam', () => {
    expect(lerConvite(form({ email: 'ana', nome: 'Ana', papel: 'revisor' }))).toEqual({ ok: false, erro: 'Escreva um e-mail válido.' });
    expect(lerConvite(form({ email: 'ana@exemplo.org', nome: 'Ana', papel: 'dono' }))).toEqual({ ok: false, erro: 'Escolha o papel: editor, revisor ou redator.' });
    expect(lerConvite(form({ email: 'ana@exemplo.org', nome: '  ', papel: 'redator' }))).toEqual({ ok: false, erro: 'Escreva o nome da pessoa.' });
  });
});

describe('mudancaNaEquipe', () => {
  const editor = { id: 'eu', papel: 'editor' as const };

  test('só editor mexe na equipe', () => {
    expect(mudancaNaEquipe({ id: 'eu', papel: 'revisor' }, 'outro', 'remover')).toBe('Só quem é editor mexe na equipe.');
    expect(mudancaNaEquipe(editor, 'outro', 'remover')).toBeNull();
    expect(mudancaNaEquipe(editor, 'outro', 'papel')).toBeNull();
  });

  test('ninguém tira a si mesmo nem muda o próprio papel (o painel nunca fica sem editor)', () => {
    expect(mudancaNaEquipe(editor, 'eu', 'remover')).toBe('Você não pode tirar a si mesmo da equipe.');
    expect(mudancaNaEquipe(editor, 'eu', 'papel')).toBe('Você não pode mudar o próprio papel.');
  });
});

describe('lerSenhaNova', () => {
  test('senha longa e repetida igual', () => {
    expect(lerSenhaNova(form({ senha: 'uma-senha-comprida', repetir: 'uma-senha-comprida' }))).toEqual({ ok: true, valor: 'uma-senha-comprida' });
    expect(lerSenhaNova(form({ senha: 'curta', repetir: 'curta' }))).toEqual({ ok: false, erro: 'A senha precisa de pelo menos 12 caracteres.' });
    expect(lerSenhaNova(form({ senha: 'uma-senha-comprida', repetir: 'outra-senha-comprida' }))).toEqual({ ok: false, erro: 'As duas senhas não são iguais.' });
  });
});
