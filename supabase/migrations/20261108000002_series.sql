-- Séries da newsletter no banco: o editor cria e edita pelo painel; o site lista as ligadas.
-- O endereço (slug) não muda depois de criado: peças, agenda e ritmo apontam para ele (on update restrict).

create table series (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  nome text not null check (char_length(trim(nome)) between 1 and 60),
  nome_es text not null check (char_length(trim(nome_es)) between 1 and 60),
  descricao text not null default '' check (char_length(descricao) <= 300),
  descricao_es text not null default '' check (char_length(descricao_es) <= 300),
  selo text not null check (char_length(trim(selo)) between 1 and 40),
  selo_es text not null check (char_length(trim(selo_es)) between 1 and 40),
  ativa boolean not null default true,
  criada_em timestamptz not null default now()
);

insert into series (slug, nome, nome_es, descricao, descricao_es, selo, selo_es) values (
  'memoria-operaria', 'Memória Operária', 'Memoria Obrera',
  'Direito nenhum caiu do céu. Foi luta. Uma edição toda segunda, com as fontes.',
  'Ningún derecho cayó del cielo. Fue lucha. Una edición cada lunes, con las fuentes.',
  'MEMÓRIA OPERÁRIA*', 'MEMORIA OBRERA*'
);

alter table pecas add constraint pecas_serie_fk foreign key (serie) references series (slug) on update restrict on delete restrict;
alter table agenda add constraint agenda_serie_fk foreign key (serie) references series (slug) on update restrict on delete restrict;
alter table ritmo add constraint ritmo_serie_fk foreign key (serie) references series (slug) on update restrict on delete restrict;

alter table series enable row level security;
create policy series_publicas on series for select to anon, authenticated using (ativa);
create policy series_equipe_le on series for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy series_editor_cria on series for insert to authenticated
  with check (privado.com_2fa() and privado.papel_atual() = 'editor');
create policy series_editor_edita on series for update to authenticated
  using (privado.com_2fa() and privado.papel_atual() = 'editor')
  with check (privado.com_2fa() and privado.papel_atual() = 'editor');
-- Sem política de delete: série sai do site desligando, nunca apagando.

-- O endereço é fixo: nem o editor muda o slug depois de criado.
create or replace function series_slug_fixo() returns trigger language plpgsql set search_path = public as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'o endereço da série não muda depois de criado' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function series_slug_fixo() from public, anon, authenticated;
create trigger series_slug_fixo before update on series for each row execute function series_slug_fixo();
