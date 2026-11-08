-- Página /privacidade (spec consultas §4, LGPD). Entra em rascunho: o fundador revisa e publica pelo painel.
insert into pecas (tipo, slug, titulo, resumo, corpo, estado, fontes)
values (
  'pagina',
  'privacidade',
  'Privacidade',
  '',
  'O que guardamos: a sua opção, o relato (se você escrever), um código do aparelho e um código da rede, os dois embaralhados de um jeito que não dá para desfazer. O que não guardamos: nome, e-mail ou o endereço de IP aberto. A página de votar usa o Cloudflare Turnstile, que vê o seu IP para conferir que você não é um robô. Para apagar o seu relato, mande o comprovante para o PUKAS.',
  'rascunho',
  '[]'
)
on conflict do nothing;
