import { describe, expect, test } from 'vitest';
import { comConta, contasDeVotoParaApagar, sessaoGoogle } from './conta';

const segredo = 'segredo-de-teste';

describe('sessaoGoogle', () => {
  test('só vale com identidade do Google', () => {
    expect(sessaoGoogle({ id: 'u1', identities: [{ provider: 'google', id: 'g-123' }] })).toEqual({ uid: 'u1', googleId: 'g-123' });
    expect(sessaoGoogle({ id: 'u2', identities: [{ provider: 'email', id: 'x' }] })).toBeNull();
    expect(sessaoGoogle(null)).toBeNull();
  });

  // Revisão de segurança 08/11: conta da equipe que também entrou com Google não pode virar "conta temporária de voto"
  // (seria apagada depois do voto). Só vale a conta que tem o Google como única identidade.
  test('conta com mais de uma identidade (e-mail + Google) não vale', () => {
    expect(sessaoGoogle({ id: 'u3', identities: [{ provider: 'email', id: 'x' }, { provider: 'google', id: 'g' }] })).toBeNull();
  });
});

describe('comConta', () => {
  test('sem sessão, volta robo e não chama nada', async () => {
    const chamadas: string[] = [];
    const r = await comConta(null, segredo, async () => (chamadas.push('votar'), 'ok'), async () => void chamadas.push('apagar'));
    expect(r).toBe('robo');
    expect(chamadas).toEqual([]);
  });

  test('com sessão, apaga a conta depois de gravar, também no voto repetido e no erro', async () => {
    for (const desfecho of ['ok', 'ja']) {
      const chamadas: string[] = [];
      const r = await comConta({ uid: 'u1', googleId: 'g' }, segredo, async () => (chamadas.push('votar'), desfecho), async (uid) => void chamadas.push(`apagar:${uid}`));
      expect(r).toBe(desfecho);
      expect(chamadas).toEqual(['votar', 'apagar:u1']);
    }
    const chamadas: string[] = [];
    await expect(
      comConta({ uid: 'u1', googleId: 'g' }, segredo, async () => { throw new Error('banco'); }, async (uid) => void chamadas.push(`apagar:${uid}`)),
    ).rejects.toThrow('banco');
    expect(chamadas).toEqual(['apagar:u1']);
  });

  test('o hash da conta é o mesmo para o mesmo Google e não é o id cru', async () => {
    const hashes: string[] = [];
    const votar = async (h: string) => (hashes.push(h), 'ok');
    await comConta({ uid: 'u1', googleId: 'g-9' }, segredo, votar, async () => {});
    await comConta({ uid: 'u2', googleId: 'g-9' }, segredo, votar, async () => {});
    await comConta({ uid: 'u3', googleId: 'g-8' }, segredo, votar, async () => {});
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[0]).not.toBe(hashes[2]);
    expect(hashes[0]).not.toContain('g-9');
  });
});

describe('contasDeVotoParaApagar', () => {
  const agora = new Date('2026-11-08T12:00:00Z');
  const conta = (id: string, providers: string[], criada: string) => ({ id, created_at: criada, identities: providers.map((p) => ({ provider: p, id: `${p}-${id}` })) });
  test('só conta só-Google, sem perfil e criada há mais de 1 hora', () => {
    const contas = [
      conta('velha', ['google'], '2026-11-08T10:00:00Z'),
      conta('nova', ['google'], '2026-11-08T11:30:00Z'),
      conta('equipe-google', ['google'], '2026-11-01T10:00:00Z'),
      conta('email', ['email'], '2026-11-01T10:00:00Z'),
      conta('mista', ['email', 'google'], '2026-11-01T10:00:00Z'),
    ];
    expect(contasDeVotoParaApagar(contas, new Set(['equipe-google']), agora)).toEqual(['velha']);
  });
});
