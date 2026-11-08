// Alto impacto (spec consultas §2): uma pessoa por voto pelo login Google, sem guardar e-mail.
// O banco guarda só o HMAC do id do Google; a conta temporária do Supabase é apagada depois do voto, dê no que der.
import { hashSecreto } from './voto';

export interface SessaoGoogle {
  uid: string;
  googleId: string;
}

export function sessaoGoogle(user: { id: string; identities?: { provider: string; id: string }[] } | null): SessaoGoogle | null {
  const google = user?.identities?.find((i) => i.provider === 'google');
  return user && google ? { uid: user.id, googleId: google.id } : null;
}

export async function comConta<T>(sessao: SessaoGoogle | null, segredo: string, votar: (contaHash: string) => Promise<T>, apagar: (uid: string) => Promise<void>): Promise<T | 'robo'> {
  if (!sessao) return 'robo';
  try {
    return await votar(await hashSecreto(segredo, `google:${sessao.googleId}`));
  } finally {
    await apagar(sessao.uid);
  }
}
