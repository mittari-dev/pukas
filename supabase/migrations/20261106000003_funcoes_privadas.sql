-- Funções de apoio fora da API pública (avisos 0028/0029 do Supabase).
-- As políticas guardam a função pelo identificador interno, então mudar de esquema não quebra nenhuma.

-- Funções de gatilho: só o banco chama.
revoke execute on function public.pecas_historico() from public, anon, authenticated;
revoke execute on function public.correcoes_historico() from public, anon, authenticated;
revoke execute on function public.pecas_travas() from public, anon, authenticated;
revoke execute on function public.historico_imutavel() from public, anon, authenticated;

-- Funções usadas pelas políticas: precisam ser executáveis, mas não chamáveis por /rest/v1/rpc.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;

alter function public.papel_atual() set schema privado;
alter function public.com_2fa() set schema privado;
alter function public.no_ar(uuid) set schema privado;
alter function privado.papel_atual() set search_path = public;
alter function privado.no_ar(uuid) set search_path = public;
