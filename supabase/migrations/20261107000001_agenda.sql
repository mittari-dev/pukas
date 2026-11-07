-- Agenda editorial (spec agenda §2, §3, §5 e §6). Só organiza: nada aqui publica.

create type situacao_agenda as enum ('ideia', 'escrevendo', 'pronta');

-- Um item é da agenda, não é a peça. Ligado a uma peça, a situação mostrada passa a ser a dela (calculada no painel).
create table agenda (
  id uuid primary key default gen_random_uuid(),
  dia date not null,
  tipo tipo_peca not null check (tipo <> 'pagina'),
  serie text,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  nota text,
  situacao situacao_agenda not null default 'ideia',
  peca_id uuid unique references pecas on delete set null,
  responsavel uuid references perfis on delete set null,
  criado_por uuid default auth.uid() references auth.users on delete set null,
  criado_em timestamptz not null default now(),
  check (tipo <> 'newsletter' or serie is not null)
);
create index agenda_dia on agenda (dia);

-- Ritmo da casa: compromissos fixos por dia da semana (1 = segunda … 7 = domingo). Aparece como espaço reservado.
create table ritmo (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 1 and 7),
  tipo tipo_peca not null check (tipo <> 'pagina'),
  serie text,
  rotulo text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  check (tipo <> 'newsletter' or serie is not null)
);
insert into ritmo (dia_semana, tipo, serie) values (1, 'newsletter', 'memoria-operaria');

alter table agenda enable row level security;
alter table ritmo enable row level security;

create policy agenda_equipe_le on agenda for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy agenda_equipe_cria on agenda for insert to authenticated with check (privado.com_2fa() and privado.papel_atual() is not null);
create policy agenda_equipe_edita on agenda for update to authenticated
  using (privado.com_2fa() and privado.papel_atual() is not null)
  with check (privado.com_2fa() and privado.papel_atual() is not null);
create policy agenda_apaga on agenda for delete to authenticated
  using (privado.com_2fa() and (privado.papel_atual() in ('editor', 'revisor') or (privado.papel_atual() = 'redator' and criado_por = auth.uid())));

create policy ritmo_equipe_le on ritmo for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy ritmo_editor_grava on ritmo for all to authenticated
  using (privado.com_2fa() and privado.papel_atual() = 'editor')
  with check (privado.com_2fa() and privado.papel_atual() = 'editor');

-- Responsável do item: quem é da equipe (com 2FA) vê o nome e o papel dos colegas. Quem não é, segue vendo só o próprio.
create policy perfis_equipe_le on perfis for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
