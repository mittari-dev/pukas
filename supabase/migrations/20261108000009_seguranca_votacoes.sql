-- Revisão de segurança (08/11/2026): a parcial e os comprovantes de uma votação só saem pelo site, que os esconde
-- de quem ainda não votou. Pela API pública, anônimo não chama; conta logada só vê se for da equipe com 2FA.

create or replace function resultado_votacao(v uuid) returns table (a_favor int, contra int, nao_sei int, descartes jsonb)
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
  having exists (select 1 from pecas where id = v and tipo = 'votacao' and estado = 'publicada')
    and (auth.role() = 'service_role' or (privado.com_2fa() and privado.papel_atual() is not null));
$$;

create or replace function comprovantes_votacao(v uuid) returns table (comprovante text, opcao opcao_voto, dia date)
language sql stable security definer set search_path = public as $$
  select o.comprovante, o.opcao, (o.criado_em at time zone 'America/Sao_Paulo')::date
  from votos o
  where o.votacao_id = v and not o.descartado
    and exists (select 1 from pecas where id = v and tipo = 'votacao' and estado = 'publicada')
    and (auth.role() = 'service_role' or (privado.com_2fa() and privado.papel_atual() is not null))
  order by o.criado_em;
$$;

revoke execute on function resultado_votacao(uuid), comprovantes_votacao(uuid) from public, anon;
grant execute on function resultado_votacao(uuid), comprovantes_votacao(uuid) to authenticated, service_role;

-- Link curto: a mesma regra do código (src/lib/links.ts); espaço e caractere de controle viram outro domínio no navegador.
alter table links_curtos drop constraint if exists links_curtos_destino_check;
alter table links_curtos add constraint links_curtos_destino_check check (destino ~ '^/(?![/\\])[^[:space:][:cntrl:]]*$');

-- Confirmação da newsletter: no máximo 3 envios por endereço, contados à parte (o pedido não "rejuvenesce").
alter table assinantes add column envios int not null default 1, add column ultimo_envio timestamptz not null default now();
