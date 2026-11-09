-- Assinatura por série: quais newsletters a pessoa quer receber. Vazio = todas (quem assinou antes, ou só há uma série).
alter table assinantes add column series text[] not null default '{}';

-- Painel: confirmados por série (quem tem a lista vazia conta em todas). Só números, só para a equipe com 2FA.
create function painel_assinantes_por_serie() returns table (serie text, confirmados int)
language sql stable security definer set search_path = public as $$
  select s.slug, (select count(*)::int from assinantes a where a.confirmado_em is not null and (a.series = '{}' or s.slug = any(a.series)))
  from series s
  where s.ativa and privado.com_2fa() and privado.papel_atual() is not null
  order by s.criada_em;
$$;
revoke execute on function painel_assinantes_por_serie() from public, anon;
grant execute on function painel_assinantes_por_serie() to authenticated;
