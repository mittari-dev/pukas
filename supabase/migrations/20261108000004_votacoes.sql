-- Votações (spec consultas §4 e §5). O público só lê resultado e comprovantes por função; voto entra só pela rota, com a chave de serviço.

alter table pecas
  add column proposicao jsonb,
  add column fecha_em timestamptz,
  add column alto_impacto boolean not null default false,
  add check (tipo <> 'votacao' or slug is not null);

-- Versão de 20261107000003 mais as travas da votação e o prazo de 30 dias.
create or replace function pecas_travas() returns trigger
language plpgsql set search_path = public as $$
declare
  problemas text[] := '{}';
  n int;
begin
  new.atualizado_em := now();
  if auth.role() is distinct from 'service_role' then
    new.atualizado_por := auth.uid();
  end if;
  -- Prazo da votação: nasce na primeira publicação e a equipe não o mexe. Só a chave mestra (robô do plenário) fecha antes.
  if new.tipo = 'votacao' and auth.role() is distinct from 'service_role' then
    new.fecha_em := case when tg_op = 'UPDATE' then old.fecha_em end;
  end if;
  if new.estado <> 'publicada' then
    return new;
  end if;
  if auth.role() is distinct from 'service_role' and (tg_op = 'INSERT' or old.estado <> 'publicada') then
    new.publicada_em := now();
  else
    new.publicada_em := coalesce(new.publicada_em, now());
  end if;
  if new.tipo = 'votacao' then
    new.fecha_em := coalesce(new.fecha_em, now() + interval '30 days');
  end if;

  if new.tipo = 'newsletter' then
    if not exists (select 1 from jsonb_array_elements(new.fontes) f where f->>'tipo' = 'primaria') then
      problemas := array_append(problemas, 'sem fonte primária');
    end if;
  elsif new.tipo in ('noticia', 'votacao') then
    if jsonb_array_length(new.fontes) = 0 then
      problemas := array_append(problemas, 'sem fonte');
    end if;
  end if;

  if new.tipo = 'votacao' and new.proposicao is null then
    problemas := array_append(problemas, 'sem proposição');
  end if;

  if new.tipo = 'newsletter' then
    if vazio(new.foto_caminho) then
      problemas := array_append(problemas, 'sem foto');
    elsif vazio(new.foto_descricao) then
      problemas := array_append(problemas, 'foto sem descrição');
    end if;
  end if;

  if new.tipo = 'newsletter' or (new.tipo = 'noticia' and new.foto_caminho is not null) then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'foto sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'foto sem crédito'); end if;
  elsif new.tipo = 'cultura' and new.foto_caminho is not null then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'capa sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'capa sem crédito'); end if;
  end if;

  if new.tipo in ('newsletter', 'noticia', 'votacao') then
    if new.checagem is null or new.checagem = 'null'::jsonb then
      problemas := array_append(problemas, 'sem checagem');
    end if;
    n := palavras_manchete(new.titulo);
    if n > 8 then
      problemas := array_append(problemas, format('manchete com %s palavras (máx. 8)', n));
    end if;
  end if;

  if array_length(problemas, 1) > 0 then
    raise exception '%', array_to_string(problemas, '; ') using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Ligação votação ↔ notícias.
create table votacao_noticias (
  votacao_id uuid not null references pecas on delete cascade,
  noticia_id uuid not null references pecas on delete cascade,
  primary key (votacao_id, noticia_id)
);
alter table votacao_noticias enable row level security;
create policy votacao_noticias_publicas on votacao_noticias for select to anon, authenticated
  using (exists (select 1 from pecas where id = votacao_id and estado = 'publicada')
     and exists (select 1 from pecas where id = noticia_id and estado = 'publicada'));
create policy votacao_noticias_equipe on votacao_noticias for all to authenticated
  using (privado.com_2fa() and privado.papel_atual() is not null)
  with check (privado.com_2fa() and privado.papel_atual() is not null);

create type opcao_voto as enum ('a_favor', 'contra', 'nao_sei');

create table votos (
  id uuid primary key default gen_random_uuid(),
  votacao_id uuid not null references pecas on delete restrict,
  opcao opcao_voto not null,
  relato text check (char_length(relato) <= 1000),
  citar boolean not null default false,
  comprovante text not null unique,
  aparelho_hash text not null,
  ip_hash text not null,
  conta_hash text,
  criado_em timestamptz not null default now(),
  descartado boolean not null default false,
  motivo text,
  check (descartado = (motivo is not null))
);
create unique index votos_aparelho on votos (votacao_id, aparelho_hash);
create unique index votos_conta on votos (votacao_id, conta_hash) where conta_hash is not null;
create index votos_rede on votos (votacao_id, ip_hash, criado_em) where not descartado;

alter table votos enable row level security;
-- Sem política para anon: nem leitura nem escrita. A equipe que lê relatos é editor e revisor.
create policy votos_editor_revisor_le on votos for select to authenticated
  using (privado.com_2fa() and privado.papel_atual() in ('editor', 'revisor'));

create function votos_aberta() returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from pecas
    where id = new.votacao_id and tipo = 'votacao' and estado = 'publicada' and (fecha_em is null or now() <= fecha_em)
  ) then
    raise exception 'votação fechada' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function votos_aberta() from public, anon, authenticated;
create trigger votos_aberta before insert on votos for each row execute function votos_aberta();

create function resultado_votacao(v uuid) returns table (a_favor int, contra int, nao_sei int, descartes jsonb)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where not o.descartado and o.opcao = 'a_favor')::int,
    count(*) filter (where not o.descartado and o.opcao = 'contra')::int,
    count(*) filter (where not o.descartado and o.opcao = 'nao_sei')::int,
    coalesce((select jsonb_object_agg(d.motivo, d.n) from (
      select motivo, count(*)::int n from votos where votacao_id = v and descartado group by motivo
    ) d), '{}'::jsonb)
  from votos o
  where o.votacao_id = v
  -- Sem votos, sai uma linha de zeros; votação fora do ar, nenhuma linha.
  having exists (select 1 from pecas where id = v and tipo = 'votacao' and estado = 'publicada');
$$;

create function comprovantes_votacao(v uuid) returns table (comprovante text, opcao opcao_voto, dia date)
language sql stable security definer set search_path = public as $$
  select o.comprovante, o.opcao, (o.criado_em at time zone 'America/Sao_Paulo')::date
  from votos o
  where o.votacao_id = v and not o.descartado
    and exists (select 1 from pecas where id = v and tipo = 'votacao' and estado = 'publicada')
  order by o.criado_em;
$$;

create function apagar_relato(c text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not (privado.com_2fa() and privado.papel_atual() = 'editor') then
    return false;
  end if;
  update votos set relato = null, citar = false where comprovante = c;
  return found;
end $$;

revoke execute on function resultado_votacao(uuid), comprovantes_votacao(uuid), apagar_relato(text) from public;
grant execute on function resultado_votacao(uuid), comprovantes_votacao(uuid) to anon, authenticated;
grant execute on function apagar_relato(text) to authenticated;

-- Plenário: o robô grava com a chave de serviço; o público lê quando a votação está no ar.
create table plenario_votacoes (
  id uuid primary key default gen_random_uuid(),
  votacao_id uuid not null references pecas on delete cascade,
  casa text not null check (casa in ('camara', 'senado')),
  id_oficial text not null,
  data timestamptz not null,
  descricao text not null default '',
  sim int not null default 0,
  nao int not null default 0,
  abstencao int not null default 0,
  outros int not null default 0,
  unique (votacao_id, casa, id_oficial)
);
create table plenario_votos (
  plenario_id uuid not null references plenario_votacoes on delete cascade,
  nome text not null,
  partido text not null default '',
  uf text not null default '',
  voto text not null
);
create index plenario_votos_plenario on plenario_votos (plenario_id);

alter table plenario_votacoes enable row level security;
alter table plenario_votos enable row level security;
create policy plenario_votacoes_publicas on plenario_votacoes for select to anon, authenticated
  using (exists (select 1 from pecas where id = votacao_id and estado = 'publicada'));
create policy plenario_votos_publicos on plenario_votos for select to anon, authenticated
  using (exists (
    select 1 from plenario_votacoes p join pecas on pecas.id = p.votacao_id
    where p.id = plenario_id and pecas.estado = 'publicada'
  ));
