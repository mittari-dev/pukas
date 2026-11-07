-- Conteúdo do PUKAS (spec painel §3): peças, traduções, correções, histórico e perfis.
-- As travas editoriais vivem aqui: o banco é a autoridade, o painel só ajuda.

create type tipo_peca as enum ('newsletter', 'cultura', 'noticia', 'pagina');
create type estado_peca as enum ('rascunho', 'em_revisao', 'publicada', 'rejeitada');
create type papel as enum ('editor', 'revisor', 'redator');
create type estado_traducao as enum ('pendente', 'pronta', 'erro');

create table perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text not null default '',
  papel papel not null default 'redator'
);

create table pecas (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_peca not null,
  serie text,
  numero int,
  slug text,
  subtipo text check (subtipo in ('conto', 'cena', 'poema', 'ensaio')),
  autoria text not null default 'PUKAS',
  titulo text not null,
  resumo text not null default '' check (char_length(resumo) <= 280),
  legenda text check (char_length(legenda) <= 2200),
  aviso text,
  corpo text not null default '',
  foto_caminho text,
  foto_descricao text,
  foto_credito text,
  foto_licenca text,
  foto_origem text,
  video text,
  fontes jsonb not null default '[]' check (jsonb_typeof(fontes) = 'array'),
  checagem jsonb,
  traduzir boolean not null default true,
  estado estado_peca not null default 'rascunho',
  publicada_em timestamptz,
  criado_por uuid references auth.users on delete set null,
  atualizado_por uuid references auth.users on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (tipo <> 'newsletter' or (serie is not null and numero is not null)),
  check (tipo <> 'cultura' or (numero is not null and subtipo is not null)),
  -- O slug é o endereço: /cultura/<slug>, /noticias/<slug>, /<slug> (páginas).
  check (tipo not in ('pagina', 'noticia', 'cultura') or slug is not null)
);

create unique index pecas_newsletter_numero on pecas (tipo, serie, numero) where tipo = 'newsletter';
create unique index pecas_cultura_numero on pecas (tipo, numero) where tipo = 'cultura';
create unique index pecas_slug on pecas (tipo, slug) where slug is not null;
create index pecas_estado on pecas (estado, tipo);

create table traducoes (
  peca_id uuid not null references pecas on delete cascade,
  idioma text not null default 'es' check (idioma = 'es'),
  titulo text,
  resumo text,
  legenda text,
  aviso text,
  corpo text,
  revisado boolean not null default false,
  modelo text,
  estado estado_traducao not null default 'pendente',
  lote_id text,
  erro text,
  atualizado_em timestamptz not null default now(),
  primary key (peca_id, idioma)
);

create table correcoes (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references pecas on delete cascade,
  data date not null default current_date,
  texto text not null check (char_length(trim(texto)) > 0)
);

-- Sem chave estrangeira: o histórico sobrevive até à peça.
create table historico (
  id bigint generated always as identity primary key,
  peca_id uuid not null,
  acao text not null check (acao in ('salvar', 'publicar', 'rejeitar', 'corrigir')),
  quem uuid,
  quando timestamptz not null default now(),
  antes jsonb not null
);
create index historico_peca on historico (peca_id, quando);

-- Mesma contagem de textoManchete/contarPalavras: | e * viram espaço.
create function palavras_manchete(t text) returns int
language sql immutable set search_path = public as $$
  select count(*)::int
  from regexp_split_to_table(trim(regexp_replace(translate(coalesce(t, ''), '|*', '  '), '\s+', ' ', 'g')), ' ') p
  where p <> ''
$$;

create function vazio(t text) returns boolean
language sql immutable set search_path = public as $$ select coalesce(trim(t), '') = '' $$;

-- Mensagens idênticas às de validarPublicavel/validarObra, na mesma ordem.
create function pecas_travas() returns trigger
language plpgsql set search_path = public as $$
declare
  problemas text[] := '{}';
  n int;
begin
  new.atualizado_em := now();
  if new.estado <> 'publicada' then
    return new;
  end if;
  new.publicada_em := coalesce(new.publicada_em, now());

  if new.tipo = 'newsletter' then
    if not exists (select 1 from jsonb_array_elements(new.fontes) f where f->>'tipo' = 'primaria') then
      problemas := array_append(problemas, 'sem fonte primária');
    end if;
  elsif new.tipo = 'noticia' then
    if jsonb_array_length(new.fontes) = 0 then
      problemas := array_append(problemas, 'sem fonte');
    end if;
  end if;

  if new.tipo = 'newsletter' or (new.tipo = 'noticia' and new.foto_caminho is not null) then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'foto sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'foto sem crédito'); end if;
  elsif new.tipo = 'cultura' and new.foto_caminho is not null then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'capa sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'capa sem crédito'); end if;
  end if;

  if new.tipo in ('newsletter', 'noticia') then
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

create trigger pecas_travas before insert or update on pecas
for each row execute function pecas_travas();

-- security definer: grava mesmo sem política de escrita em historico.
create function pecas_historico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into historico (peca_id, acao, quem, antes)
  values (
    old.id,
    case
      when new.estado = 'publicada' and old.estado <> 'publicada' then 'publicar'
      when new.estado = 'rejeitada' and old.estado <> 'rejeitada' then 'rejeitar'
      else 'salvar'
    end,
    auth.uid(),
    to_jsonb(old)
  );
  return new;
end $$;

create trigger pecas_historico after update on pecas
for each row execute function pecas_historico();

create function correcoes_historico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into historico (peca_id, acao, quem, antes)
  select p.id, 'corrigir', auth.uid(), to_jsonb(p) from pecas p where p.id = new.peca_id;
  return new;
end $$;

create trigger correcoes_historico after insert on correcoes
for each row execute function correcoes_historico();
