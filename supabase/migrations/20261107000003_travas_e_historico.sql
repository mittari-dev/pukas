-- Achados menores da revisão do painel:
-- newsletter exige foto e descrição; publicada_em e atualizado_por não aceitam valor plantado; histórico também contra TRUNCATE.
-- Mensagens idênticas às de travasDaPeca (src/lib/painel/travas.ts) e validarPublicavel (src/lib/edicoes.ts), na mesma ordem.

create or replace function pecas_travas() returns trigger
language plpgsql set search_path = public as $$
declare
  problemas text[] := '{}';
  n int;
begin
  new.atualizado_em := now();
  -- Quem gravou é quem está logado, não o que veio no corpo do pedido. A chave mestra (migração, robô) fica de fora.
  if auth.role() is distinct from 'service_role' then
    new.atualizado_por := auth.uid();
  end if;
  if new.estado <> 'publicada' then
    return new;
  end if;
  -- Data de publicação é a hora em que vai ao ar: uma data plantada no rascunho não sobrevive à publicação.
  if auth.role() is distinct from 'service_role' and (tg_op = 'INSERT' or old.estado <> 'publicada') then
    new.publicada_em := now();
  else
    new.publicada_em := coalesce(new.publicada_em, now());
  end if;

  if new.tipo = 'newsletter' then
    if not exists (select 1 from jsonb_array_elements(new.fontes) f where f->>'tipo' = 'primaria') then
      problemas := array_append(problemas, 'sem fonte primária');
    end if;
  elsif new.tipo = 'noticia' then
    if jsonb_array_length(new.fontes) = 0 then
      problemas := array_append(problemas, 'sem fonte');
    end if;
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

create or replace function historico_sem_truncate() returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'o histórico não se apaga';
end $$;
revoke execute on function historico_sem_truncate() from public, anon, authenticated;
create trigger historico_sem_truncate before truncate on historico for each statement execute function historico_sem_truncate();
