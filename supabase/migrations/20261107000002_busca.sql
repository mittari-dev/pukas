-- Busca: robô de notícias com curadoria (spec busca §2 a §6). O robô grava com a chave mestra; nada aqui publica.

create type estado_rodada as enum ('na_fila', 'rodando', 'pronta', 'erro', 'teto');
create type estado_candidata as enum ('nova', 'pedida', 'rascunho', 'descartada');

-- Uma linha só: a configuração do robô.
create table busca_config (
  id boolean primary key default true check (id),
  ativo boolean not null default true,
  dias smallint[] not null default '{1,3,5}',
  hora smallint not null default 7 check (hora between 0 and 23),
  busca_livre boolean not null default true,
  temas_interessa text[] not null default '{}',
  temas_evita text[] not null default '{}',
  max_candidatas smallint not null default 10 check (max_candidatas between 1 and 20),
  teto_brl numeric(8, 2) not null default 50 check (teto_brl >= 0),
  cambio numeric(6, 3) not null default 5.6 check (cambio > 0)
);
insert into busca_config default values;

create table busca_fontes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dominio text not null unique check (dominio ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  grupo text not null check (grupo in ('brasil', 'america-latina', 'mundo', 'documento')),
  ativa boolean not null default true
);
insert into busca_fontes (nome, dominio, grupo) values
  ('Agência Brasil', 'agenciabrasil.ebc.com.br', 'brasil'),
  ('Brasil de Fato', 'brasildefato.com.br', 'brasil'),
  ('Folha', 'folha.uol.com.br', 'brasil'),
  ('UOL', 'uol.com.br', 'brasil'),
  ('g1', 'g1.globo.com', 'brasil'),
  ('Agência Pública', 'apublica.org', 'brasil'),
  ('Repórter Brasil', 'reporterbrasil.org.br', 'brasil'),
  ('The Intercept Brasil', 'intercept.com.br', 'brasil'),
  ('DIEESE', 'dieese.org.br', 'brasil'),
  ('Página/12', 'pagina12.com.ar', 'america-latina'),
  ('La Jornada', 'jornada.com.mx', 'america-latina'),
  ('CIPER', 'ciperchile.cl', 'america-latina'),
  ('teleSUR', 'telesurtv.net', 'america-latina'),
  ('Reuters', 'reuters.com', 'mundo'),
  ('AP', 'apnews.com', 'mundo'),
  ('Diário Oficial da União', 'in.gov.br', 'documento'),
  ('Câmara dos Deputados', 'camara.leg.br', 'documento'),
  ('Senado Federal', 'senado.leg.br', 'documento'),
  ('IBGE', 'ibge.gov.br', 'documento');

create table busca_rodadas (
  id uuid primary key default gen_random_uuid(),
  pedida_por uuid references auth.users on delete set null,
  estado estado_rodada not null default 'na_fila',
  criada_em timestamptz not null default now(),
  comecou_em timestamptz,
  terminou_em timestamptz,
  buscas int not null default 0,
  tokens_entrada int not null default 0,
  tokens_saida int not null default 0,
  custo_brl numeric(8, 2) not null default 0,
  erro text
);
create index busca_rodadas_criada on busca_rodadas (criada_em desc);

create table busca_candidatas (
  id uuid primary key default gen_random_uuid(),
  rodada_id uuid not null references busca_rodadas on delete cascade,
  titulo text not null,
  porque text not null,
  regiao text not null check (regiao in ('brasil', 'america-latina', 'mundo')),
  tema text not null default '',
  fontes jsonb not null check (jsonb_typeof(fontes) = 'array' and jsonb_array_length(fontes) > 0),
  falta_confirmar text,
  estado estado_candidata not null default 'nova',
  motivo_descarte text,
  peca_id uuid references pecas on delete set null,
  criada_em timestamptz not null default now()
);
create index busca_candidatas_rodada on busca_candidatas (rodada_id);

-- Quem escolhe (editor e revisor) só muda o estado para pedida/descartada e o motivo; o resto é do robô.
create function candidata_so_escolha() returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if (new.titulo, new.porque, new.regiao, new.tema, new.fontes, new.falta_confirmar, new.peca_id, new.rodada_id)
     is distinct from (old.titulo, old.porque, old.regiao, old.tema, old.fontes, old.falta_confirmar, old.peca_id, old.rodada_id)
     or new.estado not in ('pedida', 'descartada') then
    raise exception 'só dá para pedir o rascunho ou descartar a candidata';
  end if;
  return new;
end $$;
revoke execute on function candidata_so_escolha() from public, anon, authenticated;
create trigger candidatas_escolha before update on busca_candidatas for each row execute function candidata_so_escolha();

alter table busca_config enable row level security;
alter table busca_fontes enable row level security;
alter table busca_rodadas enable row level security;
alter table busca_candidatas enable row level security;

create policy busca_config_le on busca_config for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy busca_config_editor on busca_config for update to authenticated
  using (privado.com_2fa() and privado.papel_atual() = 'editor') with check (privado.com_2fa() and privado.papel_atual() = 'editor');

create policy busca_fontes_le on busca_fontes for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy busca_fontes_editor on busca_fontes for all to authenticated
  using (privado.com_2fa() and privado.papel_atual() = 'editor') with check (privado.com_2fa() and privado.papel_atual() = 'editor');

create policy busca_rodadas_le on busca_rodadas for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy busca_rodadas_pede on busca_rodadas for insert to authenticated
  with check (privado.com_2fa() and privado.papel_atual() = 'editor' and pedida_por = auth.uid() and estado = 'na_fila');

create policy busca_candidatas_le on busca_candidatas for select to authenticated using (privado.com_2fa() and privado.papel_atual() is not null);
create policy busca_candidatas_escolhe on busca_candidatas for update to authenticated
  using (privado.com_2fa() and privado.papel_atual() in ('editor', 'revisor'))
  with check (privado.com_2fa() and privado.papel_atual() in ('editor', 'revisor'));
