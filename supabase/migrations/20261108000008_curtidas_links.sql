-- Curtidas (o público curte, só a equipe vê quantas) e links curtos (pukas.lat/ir/<código>).

create table curtidas (
  peca_id uuid not null references pecas on delete cascade,
  -- Mesmo código embaralhado do aparelho das votações: uma curtida por aparelho.
  aparelho_hash text not null,
  criado_em timestamptz not null default now(),
  primary key (peca_id, aparelho_hash)
);
alter table curtidas enable row level security;

create function curtidas_da_peca(p uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from curtidas where peca_id = p and privado.com_2fa() and privado.papel_atual() is not null;
$$;
revoke execute on function curtidas_da_peca(uuid) from public, anon;
grant execute on function curtidas_da_peca(uuid) to authenticated;

create table links_curtos (
  codigo text primary key check (codigo ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  -- Só caminhos do próprio site: o PUKAS não vira redirecionador para fora.
  destino text not null check (destino ~ '^/([^/\\]|$)'),
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid() references auth.users on delete set null,
  cliques int not null default 0
);
alter table links_curtos enable row level security;
create policy links_equipe on links_curtos for all to authenticated
  using (privado.com_2fa() and privado.papel_atual() is not null)
  with check (privado.com_2fa() and privado.papel_atual() is not null);

-- A rota /ir/<código> chama com a chave de serviço: conta o clique e devolve o destino.
create function seguir_link(c text) returns text
language sql security definer set search_path = public as $$
  update links_curtos set cliques = cliques + 1 where codigo = c returning destino;
$$;
revoke execute on function seguir_link(text) from public, anon, authenticated;
