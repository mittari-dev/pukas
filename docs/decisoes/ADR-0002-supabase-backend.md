# ADR-0002 — Supabase como backend da plataforma

- **Status:** Aceito (06/11/2026). A decisão foi do fundador.
- **Complementa:** [ADR-0001](ADR-0001-linguagem-e-stack.md). O site continua em TypeScript e Astro.

## Contexto

O núcleo do site é estático, com conteúdo em MDX no Git. A plataforma precisa agora de coisas que um site estático não faz:

1. **Painel `/admin`** com login e senha, para publicar e editar sem depender do terminal.
2. **Votações auditáveis** da classe trabalhadora, com proteção contra bots, metodologia aberta e um comprovante de voto que o próprio votante pode conferir.
3. **Newsletter por e-mail**, com a lista de inscritos.
4. Mais adiante: **loja**, pedidos e **documentários**.

As alternativas eram um painel que grava no Git (Keystatic ou Decap) e um backend próprio. O fundador escolheu o backend próprio. Para ele, o risco de ataque é esperado num veículo de esquerda, e por isso a resposta é fazer o sistema seguro, não evitar o sistema.

## Decisão

**Supabase** (Postgres, Auth, Storage e Edge Functions) como backend. O Astro passa a ter rotas de servidor no Vercel, onde forem necessárias.

## Requisitos de segurança (inegociáveis)

- **RLS (Row Level Security) em todas as tabelas**, sem exceção. O público só lê o que está publicado.
- **Admin** com e-mail e senha, **2FA (TOTP) obrigatório** e papel `admin` verificado no banco, nunca só no navegador. Não existe cadastro aberto de administrador.
- Chave `service_role` **só no servidor**, nunca no navegador nem no repositório.
- **Votações:**
  - limite por dispositivo e IP, guardado como hash (sem guardar o IP puro);
  - honeypot;
  - verificação anti-bot invisível;
  - login leve por *magic link* nas votações de alto impacto;
  - comprovante público (`#PK-XXXX`);
  - nota de metodologia com votos registrados, votos descartados e o motivo de cada descarte.
- **LGPD:** coletar o mínimo de dados, com política de privacidade publicada e exclusão a pedido.
- Logs e alertas de abuso, backup diário do banco e advisors de segurança do Supabase limpos antes de cada lançamento.

## Consequências

- Cada módulo (admin, votações, e-mail, loja) tem a sua spec, que detalha tabelas, políticas de RLS e ameaças.
- As regras editoriais de verdade (`src/lib/edicoes.ts`) continuam valendo. O painel aplica as mesmas validações antes de publicar.
- A migração do conteúdo do MDX para o banco, se acontecer, é decidida na spec do painel.
