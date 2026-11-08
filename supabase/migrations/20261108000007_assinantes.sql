-- Newsletter por e-mail. Só a chave de serviço (rotas /api e robô) toca nos e-mails; a equipe vê só números.

create table assinantes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  idioma text not null check (idioma in ('pt', 'es')),
  -- Vai nos links de confirmar e de sair.
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  -- Quantos e-mails de boas-vindas já saíram (0 a 3) e quando sai o próximo.
  boas_vindas int not null default 0 check (boas_vindas between 0 and 3),
  proximo_em timestamptz
);
create unique index assinantes_email on assinantes (lower(email));
create index assinantes_fila on assinantes (proximo_em) where proximo_em is not null;
alter table assinantes enable row level security;

-- Entradas e saídas, sem e-mail: só para o painel contar.
create table assinantes_eventos (
  tipo text not null check (tipo in ('entrou', 'saiu')),
  em timestamptz not null default now()
);
alter table assinantes_eventos enable row level security;

-- Cada edição sai por e-mail uma vez só.
create table envios_newsletter (
  peca_id uuid primary key references pecas on delete restrict,
  enviado_em timestamptz not null default now(),
  enviados int not null default 0,
  falhas int not null default 0,
  por uuid references auth.users on delete set null
);
alter table envios_newsletter enable row level security;
create policy envios_equipe_le on envios_newsletter for select to authenticated
  using (privado.com_2fa() and privado.papel_atual() is not null);

create function painel_assinantes() returns table (confirmados int, pendentes int, entraram_30 int, sairam_30 int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from assinantes where confirmado_em is not null),
    (select count(*)::int from assinantes where confirmado_em is null),
    (select count(*)::int from assinantes_eventos where tipo = 'entrou' and em > now() - interval '30 days'),
    (select count(*)::int from assinantes_eventos where tipo = 'saiu' and em > now() - interval '30 days')
  where privado.com_2fa() and privado.papel_atual() is not null;
$$;
revoke execute on function painel_assinantes() from public, anon;
grant execute on function painel_assinantes() to authenticated;
