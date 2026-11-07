# Painel `/admin` e conteúdo no Supabase — design

- **Data:** 2026-11-06
- **Estado:** em revisão
- **Decisões de base:** [ADR-0002](../decisoes/ADR-0002-supabase-backend.md) (Supabase, RLS em tudo, 2FA obrigatório, `service_role` só no servidor)
- **Depende de:** [espanhol](2026-11-06-espanhol-design.md) (PR #24)

## 1. Por que

O fundador quer uma seção de notícias em que um robô busca, lê e redige rascunhos, e ele aprova, edita, corrige e publica. Decidiu que essa aprovação acontece num painel, e que o painel vem primeiro. Decidiu também (opção B) que **todo o conteúdo passa a morar no Supabase**: o site deixa de ser gerado a partir de arquivos no Git e passa a ler o banco.

Este documento cobre só a **etapa 1**. O trabalho foi dividido em três etapas, cada uma com spec, plano e entrega próprios:

| Etapa | O que entrega |
|---|---|
| **1. Núcleo do painel** (esta spec) | Login com 2FA, conteúdo no banco, fila, edição, publicação, tradução no publicar, migração do que existe |
| 2. Robô de notícias | Rotina diária que coleta, faz a triagem, apura, redige e grava rascunhos na fila (ver §9) |
| 3. Radar e pistas | Lista de nomes e temas acompanhados; pistas de investigação numa aba que nunca vai para o ar |

### Critério de sucesso da etapa 1

1. O fundador entra em `/admin` pelo celular com e-mail, senha e código do autenticador.
2. Cria uma peça, vê o que falta para publicar, publica, e ela aparece no site em pt e es.
3. Todos os endereços que existem hoje continuam abrindo com o mesmo texto.
4. Nenhuma peça fora das regras editoriais consegue chegar a `publicada`, nem por erro do painel (o banco recusa).
5. Sem 2FA, nada é gravado.

## 2. Arquitetura

- **Site:** Astro com renderização no servidor (`output: 'server'`, adaptador do Vercel). As páginas públicas vão com cache na borda do Vercel (`s-maxage` longo + `stale-while-revalidate`) e etiqueta de cache por peça e por índice. Publicar invalida só as etiquetas afetadas.
- **Painel:** no mesmo app, em `/admin/**`. Sempre `Cache-Control: private, no-store`, `noindex`, `X-Frame-Options: DENY`.
- **Banco:** Supabase (Postgres + Auth + Storage), projeto novo.
- **Storage:** bucket público `fotos` (só leitura pública; escrita só editor com 2FA) e bucket privado `arquivos` (reservado para as pistas da etapa 3; criado já, sem uso).
- **Idioma:** a escolha automática (cookie → Accept-Language → país) continua; a lógica pura em `src/lib/escolhaIdioma.ts` não muda. Com o site no servidor, ela passa para o middleware do Astro (`src/middleware.ts`), lendo o país do cabeçalho `x-vercel-ip-country`, e o `middleware.ts` da raiz é removido.
- **Segredos (Vercel, só servidor):** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (pública por natureza), `ANTHROPIC_API_KEY`. A `SUPABASE_SERVICE_ROLE_KEY` **não** vai para o Vercel: só para o script de migração (local) e, na etapa 2, para o robô.

## 3. Dados

### Tabelas

| Tabela | Campos principais |
|---|---|
| `perfis` | `id` (= `auth.users.id`), `nome`, `papel` (`editor` \| `revisor` \| `redator`) |
| `pecas` | `id`, `tipo` (`newsletter` \| `cultura` \| `noticia` \| `pagina`), `serie` (newsletter), `numero` (newsletter/cultura), `slug` (página/notícia), `subtipo` (cultura: conto/cena/poema/ensaio), `autoria`, `titulo`, `resumo`, `legenda`, `aviso`, `corpo` (Markdown), `foto_caminho`, `foto_descricao`, `foto_credito`, `foto_licenca`, `foto_origem`, `video`, `fontes` (jsonb: lista de `{nome, url}`), `checagem`, `traduzir` (bool, padrão true), `estado`, `publicada_em`, `criado_por`, `atualizado_por`, `criado_em`, `atualizado_em` |
| `traducoes` | `peca_id`, `idioma` (`es`), `titulo`, `resumo`, `legenda`, `aviso`, `corpo`, `revisado` (bool), `modelo`, `erro` (texto da última falha, se houver) |
| `correcoes` | `id`, `peca_id`, `data`, `texto` |
| `historico` | `id`, `peca_id`, `acao` (`salvar` \| `publicar` \| `rejeitar` \| `corrigir`), `quem`, `quando`, `antes` (jsonb com a peça inteira) |

Unicidade: `(tipo='newsletter', serie, numero)`, `(tipo='cultura', numero)`, `(tipo in ('pagina','noticia'), slug)`, `(peca_id, idioma)` em `traducoes`.

### Estados

`rascunho` → `em_revisao` → `publicada`, ou `rejeitada`. Só `publicada` aparece no site. Uma peça publicada volta a ser editável sem sair do ar (ver §4, correções).

### Travas editoriais no banco

Um gatilho `before insert or update` em `pecas` recusa a passagem para `publicada` (ou qualquer gravação de peça já publicada) quando:

- `fontes` está vazio (exceto `tipo='pagina'`);
- `checagem` está vazia (newsletter e notícia);
- há foto sem `foto_credito` ou sem `foto_licenca`;
- a manchete tem mais de 8 palavras, ignorando os marcadores `|` e `*`.

As mesmas regras vivem em TypeScript (as funções que já existem em `src/lib/`), usadas pelo painel para mostrar a lista "pronto para publicar?". O banco é a autoridade; a tela é só ajuda.

A trava dos números da tradução (`problemasDaTraducao`) roda no servidor antes de gravar em `traducoes`; uma tradução com números divergentes não é gravada e o motivo vai para `traducoes.erro`.

### Histórico

Um gatilho `after update` em `pecas` grava em `historico` a versão anterior inteira. Não existe política que permita `update` ou `delete` em `historico` para nenhum papel.

## 4. Painel

Feito primeiro para o celular, com a identidade v2.0 (receita Leitura).

1. **Entrar** (`/admin/entrar`): e-mail e senha, depois o código TOTP. No primeiro acesso, mostra o QR para cadastrar o autenticador; sem cadastro, não passa. Tentativas erradas seguidas travam o login por alguns minutos (limite do Supabase Auth mais um limite próprio por IP no servidor).
2. **Fila** (`/admin`): abas Rascunhos · Em revisão · Publicadas · Rejeitadas, filtro por tipo. Cada linha mostra título, tipo, autor e última alteração. Botão Nova peça.
3. **Editar peça** (`/admin/peca/novo`, `/admin/peca/[id]`):
   - campos conforme o tipo;
   - manchete com contador de palavras e prévia das quebras e do destaque;
   - corpo em Markdown com alternância escrever/ver;
   - fontes como lista (nome + link), checagem, foto com envio e crédito/licença obrigatórios;
   - lista "pronto para publicar?" com ✓/✗ por trava; Publicar só acende com tudo ✓;
   - botões Salvar · Enviar para revisão · Publicar · Rejeitar, conforme o papel.
   - O texto em edição é guardado no aparelho (`localStorage`) até salvar, para não se perder se a conexão cair.
4. **Espanhol** (aba da peça): ao publicar, o servidor envia a tradução ao Claude pela **API de lotes** (Message Batches, com desconto), com as mesmas instruções de `scripts/traduzir.ts` e um **modelo mais barato que o Opus** (`claude-sonnet-5-5`, numa constante; se o custo medido permitir, pode baixar para `claude-haiku-5-5`). Um workflow agendado do GitHub Actions (a cada 15 minutos, com a `service_role`) recolhe os lotes prontos, passa pela trava dos números, grava com `revisado=false` e renova o cache da página; até lá, `/es/...` mostra a versão em português com o aviso de tradução pendente. Com a tradução, a página mostra o selo TRADUCCIÓN AUTOMÁTICA. O custo real da primeira tradução é medido e mostrado ao fundador em reais; se ficar caro, a alternativa é traduzir pelo Claude Code, sem custo de API. O editor pode editar e marcar como revisada. Se falhar, o português sai mesmo assim e a aba mostra o erro com "tentar de novo".

**Editar peça publicada:** ao salvar, o painel pergunta se é correção. Sim → pede uma linha, gravada em `correcoes` e exibida na página. Não → só fica no `historico`. Nos dois casos a versão anterior fica no histórico.

### Papéis

| Ação | redator | revisor | editor |
|---|---|---|---|
| Criar e editar rascunho | ✓ | ✓ | ✓ |
| Enviar para revisão | ✓ | ✓ | ✓ |
| Rejeitar | | ✓ | ✓ |
| Publicar, editar publicada, corrigir | | | ✓ |

Hoje só existe a conta do fundador, `editor`. Contas novas são criadas por convite, à mão no Supabase; não há tela de equipe nesta etapa.

## 5. Segurança

- **RLS em todas as tabelas.** `anon` só faz `select` em `pecas` com `estado='publicada'` e em `traducoes`/`correcoes` dessas peças. Nenhuma escrita anônima.
- **2FA no banco:** toda política de escrita exige `auth.jwt()->>'aal' = 'aal2'` e o papel certo em `perfis`. Senha sozinha não grava nada.
- **Cadastro público desligado** no Supabase Auth.
- **`historico`** só recebe inserção pelo gatilho (função `security definer`); sem `update`/`delete` para ninguém.
- **Servidor do painel:** confere sessão e `aal2` a cada pedido; cookies `HttpOnly; Secure; SameSite=Lax`; `security.checkOrigin` do Astro contra pedidos de outro site; CSP restrita em `/admin`.
- **Envio de foto:** só imagens (tipo e tamanho máximo conferidos no servidor), nome do arquivo gerado pelo servidor.
- **LGPD:** nenhum dado de visitante é coletado nesta etapa.

## 6. Migração

Um script (`scripts/migrar-para-banco.ts`, roda uma vez, com `service_role`, local) lê os arquivos de `src/content/**` e grava em `pecas`, `traducoes` e `correcoes`, mantendo série, número e slug. As fotos vão para o bucket `fotos`. Os endereços continuam os mesmos (`/manifesto`, `/es/manifesto`, `/newsletter/memoria-operaria/<n>`, `/cultura/<obra>`, os curtos `/<n>` e os RSS).

Depois da migração, `src/content/` e as coleções do Astro saem do repositório. O `scripts/traduzir.ts` e o workflow `traduzir.yml` são aposentados: a tradução passa a acontecer no publicar. As instruções de tradução vão para um módulo compartilhado usado pelo servidor.

## 7. Operação e falhas

- **Pausa do plano grátis:** o Supabase pausa projetos grátis após 7 dias sem uso. Um workflow diário do GitHub Actions faz uma consulta (mantém o projeto acordado) e **exporta todo o conteúdo publicado para `arquivo/publicado.json` no repositório**, com commit só quando muda. É backup e devolve um histórico público no Git.
- **Supabase fora do ar:** páginas em cache seguem sendo servidas (`stale-while-revalidate`). Página sem cache mostra uma página simples de "volte em instantes" (status 503). O painel mostra "banco fora do ar" e mantém o rascunho no aparelho.
- **Publicação:** numa transação só (estado + histórico + invalidação de cache depois do commit). Se falhar, a peça fica no estado anterior. Se só a invalidação de cache falhar, o painel avisa e oferece "renovar páginas".
- **Custo:** a tradução usa a mesma `ANTHROPIC_API_KEY` e conta no teto mensal de R$ 50 que a etapa 2 vai controlar.

## 8. Testes

- **Unidade (Vitest):** as validações já existentes (manchete, números, travas) continuam cobertas; novas funções do painel (montar a lista de travas, decidir ações por papel) ganham teste.
- **Banco (Supabase local):** testes que provam:
  - `anon` não lê rascunho, revisão nem rejeitada;
  - sessão sem `aal2` não grava;
  - redator não publica;
  - ninguém apaga nem altera `historico`;
  - o gatilho recusa publicar sem checagem, sem fonte, sem licença da foto ou com manchete de 9 palavras.
- **Migração:** antes de remover `src/content/`, um teste gera a lista de endereços atuais e confere que cada um abre (200) no site novo com o mesmo título e corpo.
- **CI:** o workflow atual roda também os testes de banco com o Supabase local.

## 9. Etapa 2, para registro (não implementar agora)

O robô de notícias, desenhado na conversa e aprovado em linhas gerais:

- **Critério:** só entra o que pesa para a classe trabalhadora, para a soberania do Brasil e da América Latina, ou para a luta socialista, inclusive fatos do mundo que afetam a região. Para cada notícia o robô escreve a **ponte** (1–2 frases dizendo por que importa); sem ponte, fica de fora. Sem meta de volume: dia sem nada é resposta válida.
- **Fontes:** lista fixa de grandes veículos e órgãos oficiais + busca livre na web. Portais pagos (ex.: JusBrasil) quando houver verba.
- **Fluxo diário:** coleta → triagem → apuração com busca (fonte primária, conferir números, outro lado) → rascunho com fontes e checagem → trava de números → grava na fila como `rascunho`, autor "robô", com a lista de descartes e o motivo de cada um.
- **Custo:** teto de R$ 50/mês, dividido por dia; gasto registrado; ao chegar no teto, para e avisa no painel.
- **Pistas (etapa 3):** sinais de irregularidade e tudo sobre nomes do radar viram pista com o que foi dito, quem disse e onde conferir. Nunca são publicadas como acusação: denúncia só com documento primário conferido pelo editor.

## 10. Fora desta etapa

Robô de notícias (etapa 2); radar e pistas (etapa 3); monitor de gastos da cota parlamentar (projeto próprio, junto do Raio-X); tela de equipe; envio da newsletter por e-mail; editor visual; agendamento de publicação.
