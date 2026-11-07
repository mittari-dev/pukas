// Equipe do painel: convidar (link), trocar papel, tirar. Única parte do site que usa a chave mestra (service_role),
// porque criar e apagar contas no Auth exige. Só é chamada de /painel/equipe, depois de conferir editor com 2FA.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { urlBanco } from './cliente';
import type { Papel } from '../painel/travas';

export interface Membro {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  entrou: boolean;
}

type Resultado = { ok: true } | { ok: false; erro: string };

function mestre(): SupabaseClient {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida');
  return createClient(urlBanco(), chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listarEquipe(): Promise<Membro[]> {
  const db = mestre();
  const [{ data: perfis, error }, { data: contas }] = await Promise.all([db.from('perfis').select('id, nome, papel'), db.auth.admin.listUsers({ perPage: 1000 })]);
  if (error) throw new Error(error.message);
  const porId = new Map(contas.users.map((u) => [u.id, u]));
  return (perfis ?? [])
    .map((p) => ({ ...p, email: porId.get(p.id)?.email ?? '', entrou: Boolean(porId.get(p.id)?.last_sign_in_at) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// Gera o link de convite sem mandar e-mail: o e-mail grátis do Supabase só entrega para membros da organização.
// O editor manda o link pela conversa. Ele leva a /painel/convite, onde a pessoa cria a senha.
export async function convidar(email: string, nome: string, papel: Papel, site: string): Promise<{ ok: true; link: string } | { ok: false; erro: string }> {
  const db = mestre();
  const { data, error } = await db.auth.admin.generateLink({ type: 'invite', email, options: { data: { nome } } });
  if (error) return { ok: false, erro: /already|registered|exists/i.test(error.message) ? 'Já existe uma conta com esse e-mail.' : 'Não deu para gerar o convite. Tente de novo.' };
  const { error: e } = await db.from('perfis').insert({ id: data.user.id, nome, papel });
  if (e) {
    await db.auth.admin.deleteUser(data.user.id);
    return { ok: false, erro: 'Não deu para criar o perfil. Tente de novo.' };
  }
  const link = new URL('/painel/convite', site);
  link.searchParams.set('token_hash', data.properties.hashed_token);
  return { ok: true, link: link.href };
}

export async function mudarPapel(id: string, papel: Papel): Promise<Resultado> {
  const { error } = await mestre().from('perfis').update({ papel }).eq('id', id);
  return error ? { ok: false, erro: 'Não deu para mudar o papel.' } : { ok: true };
}

// Apaga a conta (o perfil vai junto). As peças ficam; o autor delas passa a ser vazio.
export async function remover(id: string): Promise<Resultado> {
  const { error } = await mestre().auth.admin.deleteUser(id);
  return error ? { ok: false, erro: 'Não deu para tirar da equipe.' } : { ok: true };
}
