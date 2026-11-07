-- Acesso (spec painel §4 e §5): o público lê só o que está no ar; escrever exige 2FA (aal2) e o papel certo.

create function papel_atual() returns papel
language sql stable security definer set search_path = public as $$
  select papel from perfis where id = auth.uid()
$$;

create function com_2fa() returns boolean
language sql stable set search_path = public as $$ select coalesce(auth.jwt()->>'aal', '') = 'aal2' $$;

create function no_ar(peca uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pecas where id = peca and estado = 'publicada')
$$;

alter table perfis enable row level security;
alter table pecas enable row level security;
alter table traducoes enable row level security;
alter table correcoes enable row level security;
alter table historico enable row level security;

-- perfis: cada um vê o próprio. Contas novas só pela chave mestra (convite).
create policy perfis_proprio on perfis for select to authenticated using (id = auth.uid());

-- pecas
create policy pecas_publicas on pecas for select to anon, authenticated using (estado = 'publicada');
create policy pecas_equipe_le on pecas for select to authenticated using (com_2fa() and papel_atual() is not null);
create policy pecas_equipe_cria on pecas for insert to authenticated
  with check (com_2fa() and (papel_atual() = 'editor' or (papel_atual() is not null and estado in ('rascunho', 'em_revisao'))));
create policy pecas_equipe_edita on pecas for update to authenticated
  using (com_2fa() and (papel_atual() = 'editor' or (papel_atual() is not null and estado <> 'publicada')))
  with check (com_2fa() and case papel_atual()
    when 'editor' then true
    when 'revisor' then estado in ('rascunho', 'em_revisao', 'rejeitada')
    when 'redator' then estado in ('rascunho', 'em_revisao')
    else false end);

-- traducoes e correcoes: públicas quando a peça está no ar; escrita do editor (o robô usa a chave mestra).
create policy traducoes_publicas on traducoes for select to anon, authenticated using (no_ar(peca_id));
create policy traducoes_equipe_le on traducoes for select to authenticated using (com_2fa() and papel_atual() is not null);
create policy traducoes_editor on traducoes for all to authenticated
  using (com_2fa() and papel_atual() = 'editor') with check (com_2fa() and papel_atual() = 'editor');

create policy correcoes_publicas on correcoes for select to anon, authenticated using (no_ar(peca_id));
create policy correcoes_editor on correcoes for insert to authenticated with check (com_2fa() and papel_atual() = 'editor');

-- historico: a equipe lê; ninguém grava fora dos gatilhos, e ninguém altera nem apaga, nem a chave mestra.
create policy historico_equipe_le on historico for select to authenticated using (com_2fa() and papel_atual() is not null);

create function historico_imutavel() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'o histórico não pode ser alterado nem apagado';
end $$;

create trigger historico_imutavel before update or delete on historico
for each row execute function historico_imutavel();

-- Fotos públicas das matérias e arquivos privados de trabalho (pistas, etapa 3).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('arquivos', 'arquivos', false, 10485760, null);

create policy fotos_editor_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.com_2fa() and public.papel_atual() = 'editor');
create policy fotos_editor_troca on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.com_2fa() and public.papel_atual() = 'editor');
