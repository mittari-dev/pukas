-- Matérias (vídeos de quinta e dossiê do mês no YouTube): vídeo obrigatório, fonte, checagem e manchete curta, como a notícia.

alter table pecas drop constraint if exists pecas_subtipo_check;
alter table pecas add constraint pecas_subtipo_check check (subtipo in ('conto', 'cena', 'poema', 'ensaio', 'quinta', 'dossie'));
alter table pecas add check (tipo <> 'materia' or (slug is not null and subtipo in ('quinta', 'dossie')));

-- Versão de 20261108000004 mais as travas da matéria.
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
  elsif new.tipo in ('noticia', 'votacao', 'materia') then
    if jsonb_array_length(new.fontes) = 0 then
      problemas := array_append(problemas, 'sem fonte');
    end if;
  end if;

  if new.tipo = 'votacao' and new.proposicao is null then
    problemas := array_append(problemas, 'sem proposição');
  end if;

  if new.tipo = 'materia' and (new.video is null or new.video !~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/') then
    problemas := array_append(problemas, 'sem vídeo do YouTube');
  end if;

  if new.tipo = 'newsletter' then
    if vazio(new.foto_caminho) then
      problemas := array_append(problemas, 'sem foto');
    elsif vazio(new.foto_descricao) then
      problemas := array_append(problemas, 'foto sem descrição');
    end if;
  end if;

  if new.tipo = 'newsletter' or (new.tipo in ('noticia', 'materia') and new.foto_caminho is not null) then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'foto sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'foto sem crédito'); end if;
  elsif new.tipo = 'cultura' and new.foto_caminho is not null then
    if vazio(new.foto_licenca) then problemas := array_append(problemas, 'capa sem licença'); end if;
    if vazio(new.foto_credito) then problemas := array_append(problemas, 'capa sem crédito'); end if;
  end if;

  if new.tipo in ('newsletter', 'noticia', 'votacao', 'materia') then
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
