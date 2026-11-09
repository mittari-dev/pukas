// Alto impacto (spec consultas §2): uma pessoa por voto pelo login Google, sem guardar e-mail.
// O banco guarda só o HMAC do id do Google; a conta temporária do Supabase é apagada depois do voto, dê no que der.
import { hashSecreto } from './voto';

export interface SessaoGoogle {
  uid: string;
  googleId: string;
}

// Só a conta criada pelo login Google do voto: o Google como única identidade. Conta da equipe que também entrou
// com Google (e-mail + Google) não serve, porque seria apagada no fim (revisão de segurança, 08/11/2026).
export function sessaoGoogle(user: { id: string; identities?: { provider: string; id: string }[] } | null): SessaoGoogle | null {
  const ids = user?.identities ?? [];
  return user && ids.length === 1 && ids[0].provider === 'google' ? { uid: user.id, googleId: ids[0].id } : null;
}

export async function comConta<T>(sessao: SessaoGoogle | null, segredo: string, votar: (contaHash: string) => Promise<T>, apagar: (uid: string) => Promise<void>): Promise<T | 'robo'> {
  if (!sessao) return 'robo';
  try {
    return await votar(await hashSecreto(segredo, `google:${sessao.googleId}`));
  } finally {
    await apagar(sessao.uid);
  }
}

// Faxina diária: conta de voto que ficou para trás (a pessoa entrou com Google e desistiu, ou a votação fechou no meio).
// Só a conta só-Google, sem perfil da equipe, criada há mais de 1 hora (dá tempo de quem está votando terminar).
export function contasDeVotoParaApagar(
  contas: { id: string; created_at: string; identities?: { provider: string }[] }[],
  daEquipe: Set<string>,
  agora = new Date(),
): string[] {
  const limite = agora.getTime() - 60 * 60_000;
  return contas
    .filter((c) => c.identities?.length === 1 && c.identities[0].provider === 'google' && !daEquipe.has(c.id) && new Date(c.created_at).getTime() < limite)
    .map((c) => c.id);
}
