// Sair do painel (POST, para nenhum link de fora deslogar ninguém).
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.painel?.cliente.auth.signOut();
  return redirect('/admin/entrar', 303);
};
