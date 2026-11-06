# Spec — PUKAS em espanhol

- **Status:** Aprovada (06/11/2026). Desenho aprovado pelo fundador em conversa.
- **Depende de:** [site da série](2026-11-06-site-memoria-operaria-design.md) · [ADR-0001](../decisoes/ADR-0001-linguagem-e-stack.md)

## 1. Objetivo

O PUKAS é latino-americano: o site inteiro funciona em **espanhol neutro latino-americano**, e cada visitante cai no idioma certo sem precisar procurar.

**Pronto quando:**

1. Toda página da plataforma existe em `/es/...` com o mesmo caminho do português (`/cultura` → `/es/cultura`).
2. Quem chega com o celular em espanhol, ou vindo de um país hispânico sem preferência clara, entra no espanhol. Quem escolheu PT ou ES no seletor continua no idioma que escolheu.
3. Cada edição ou obra nova ganha a tradução automática no próprio PR, com o selo **TRADUCCIÓN AUTOMÁTICA** até ser revisada.
4. O build **recusa** uma tradução cujos números não batem com os do original.

## 2. Espanhol neutro (regra editorial)

O espanhol do PUKAS é o neutro latino-americano: "ustedes", nunca "vosotros", e sem gíria de um país só. Não é o espanhol da Espanha. O neutro também não generaliza à toa: os sotaques da América Latina são muito diversos, e ele abre a porta para todos.

## 3. Rotas

- **Português:** sem prefixo, como hoje.
- **Espanhol:** prefixo `/es` e o mesmo caminho, sem traduzir a URL. Ex.: `/es/manifesto`, `/es/newsletter/memoria-operaria/001`.
- As listas em espanhol mostram só o que tem tradução.
- O endereço curto `/001` continua em português. Haverá `/es/001` quando a edição tiver tradução.
- Toda página declara `hreflang` (pt-BR, es-419 e x-default) e o `<html lang>` certo.

## 4. Escolha do idioma (Vercel Routing Middleware)

A ordem é esta:

1. **Cookie `pukas_idioma`**, gravado quando a pessoa usa o seletor PT | ES.
2. **`Accept-Language`**: a primeira língua entre pt e es que aparecer na lista do aparelho.
3. **País** (`x-vercel-ip-country`): AR, BO, CL, CO, CR, CU, DO, EC, ES, GQ, GT, HN, MX, NI, PA, PE, PR, PY, SV, UY e VE vão para o espanhol. Todo o resto vai para o português.

**Onde redireciona:** só nas entradas que sempre existem nos dois idiomas, que são `/`, `/links`, `/manifesto`, `/cultura` e `/newsletter/memoria-operaria`.
- O redirecionamento é **302**, nunca permanente.
- Páginas de conteúdo não redirecionam. Elas mostram o seletor apontando para a tradução, se houver.

**Seletor:** um link com `?idioma=pt|es`. O middleware grava o cookie (1 ano, `SameSite=Lax`) e redireciona para o caminho limpo.

## 5. Tradução automática

**O que existe:** um arquivo de tradução por peça, em `src/content/es/<colecao>/<mesmo caminho>.mdx`. Ele guarda **só o texto**: `titulo`, `resumo`, `legenda`, `aviso` e o corpo. Também traz `revisado` (padrão `false`) e `modelo` (qual modelo traduziu).

**O que não é traduzido nem copiado:** números de arquivo, datas, fontes, foto, checagem e tipo. Esses dados vêm do original quando as páginas são montadas. A fonte é uma só.

**Guarda da verdade:** os números do corpo e da manchete (anos, valores, quantidades) da tradução precisam ser **os mesmos** do original, como conjunto com repetição. Se forem diferentes, o build falha e diz qual peça é e quais números divergem.

**Selo:** sem `revisado: true`, a página mostra "TRADUCCIÓN AUTOMÁTICA · el original está en portugués" com um link para o original.

**Como é gerada:**
- O script `npm run traduzir` acha as peças publicáveis sem tradução e chama a API do Claude.
- O prompt fixa o espanhol neutro latino-americano, a linguagem de bar, a preservação de números, nomes e marcações `|` e `*`, e a proibição de acrescentar fatos.
- **No GitHub:** o workflow `traduzir.yml` roda em PRs que mexem em `src/content/**`, quando o segredo `ANTHROPIC_API_KEY` existe, e faz o commit da tradução no próprio PR.
- **Cultura:** a obra com `traduzir: false` é pulada.

**Fica para depois:** retraduzir quando o original mudar. Por enquanto, o script avisa que a tradução está mais antiga que o original.

## 6. Interface em espanhol

- Todos os textos fixos (menu, botões, avisos, estados vazios, `/links`, rodapé, selos) ficam num dicionário `src/i18n/textos.ts`. Um teste garante que pt e es têm as mesmas chaves.
- **Meses em espanhol:** ENE FEB MAR ABR MAY JUN JUL AGO SEP OCT NOV DIC.
- **Manifesto em espanhol:** escrito agora, revisado com o humanizer, em `src/content/es/paginas/manifesto.mdx`. Ele não leva o selo de tradução automática.

## 7. Fora de escopo

- Inglês.
- Tradução das URLs.
- Retradução automática quando o original muda.
