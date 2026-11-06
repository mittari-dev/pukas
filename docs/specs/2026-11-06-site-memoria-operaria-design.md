# Spec — Site da série Memória Operária (fase 1)

- **Status:** Aprovada em conversa (desenho em 3 partes + página de links). Aguarda revisão escrita.
- **Data:** 06/11/2026
- **Substitui:** [2026-11-05-fundacao-e-publicacao-design.md](2026-11-05-fundacao-e-publicacao-design.md)
- **Depende de:** [ADR-0001](../decisoes/ADR-0001-linguagem-e-stack.md) · [Identidade v2.0](../design/identidade-visual.md)

## 1. Objetivo

Lançar a série **Memória Operária** no Instagram (um carrossel toda **segunda-feira**, por 10 semanas) com **credibilidade desde o primeiro dia**. Cada peça tem uma página no site com as fontes. O site é pequeno, mas já é a infraestrutura própria.

**Por quê:** o que separa o PUKAS de uma página de meme é o dado verificável. Peça política sem fonte é alvo fácil de "fake news". Com a fonte visível, a resposta já está pronta.

**Pronto quando:**

1. Uma peça escrita num arquivo MDX, depois de aprovada por PR, aparece em `pukas.lat/001` com as fontes, o crédito da foto e o registro de checagem.
2. `pukas.lat/links` mostra a última peça publicada sem nenhuma edição manual.
3. O build **recusa** uma peça sem fonte primária, sem licença da foto ou sem checagem.
4. As páginas passam no Lighthouse com Performance ≥ 95 e Acessibilidade ≥ 95 no celular.

## 2. Linguagem (regra editorial do site inteiro)

O PUKAS fala **como conversa de bar**: simples, densa, visceral, "desconfortavelmente palatável". Sem jargão de gabinete. Se uma frase precisar de glossário, ela não está pronta. Nenhum texto público usa "hegemonia", "práxis", "vanguarda" e afins.

**Compromisso com a verdade:** fato acima de ideologia. Se o fato contrariar a nossa tese, publicamos o fato. Erro tem correção pública, datada, na própria página.

## 3. Escopo

### Entra

| Rota | O que é | Receita |
|---|---|---|
| `/` | Capa: Tarja, a frase da última peça, o arquivo da série, link para o manifesto | Leitura |
| `/001`, `/002`… | **Página de fontes** de cada peça | Leitura |
| `/links` | Página da bio do Instagram: última peça (automática), manifesto, arquivo | Agitação |
| `/manifesto` | Manifesto público curto em linguagem de rua (rascunho do Claude, aprovado pelo fundador) | Leitura |
| `/rss.xml` | Feed das peças | — |

### Fica de fora (agora)

- Newsletter, dossiê, Raio-X (perto do mês 3) e loja ou impressos (ver o roadmap).
- **Gerador automático dos slides do carrossel.** Tem plano próprio, logo depois do site.
- O manifesto antigo (vanguarda, hegemonia) **não é publicado**. Vira `docs/produto/fundamentos-interno.md`.

## 4. Uma peça = um arquivo

`src/content/pecas/001-<slug>.mdx`. O frontmatter guarda os dados estruturados e o corpo guarda o texto da página.

| Campo | Tipo | Regra |
|---|---|---|
| `numero` | inteiro ≥ 1 | Único. A URL é `/` + número com 3 dígitos |
| `titulo` | texto | A frase da capa. **No máximo 8 palavras** |
| `publicadaEm` | data | Segunda-feira de publicação |
| `resumo` | texto ≤ 280 | Para a capa, os links e o RSS |
| `legenda` | texto ≤ 2200 | Legenda do Instagram (limite da plataforma) |
| `foto` | objeto | `arquivo` (imagem), `descricao` (texto alternativo), `credito`, `licenca`, `origem` (URL) |
| `fontes` | lista ≥ 1 | Cada uma com `titulo`, `instituicao`, `url`, `tipo` (`primaria` ou `secundaria`) e `acessadaEm`. **Pelo menos uma primária** |
| `checagem` | objeto | `por` e `em` (data). **Obrigatória para publicar** |
| `correcoes` | lista | `em` (data) e `texto`. Padrão `[]` |
| `rascunho` | booleano | Padrão `false`. Rascunho não gera página, não aparece em listas nem no RSS |

**Fonte primária:** lei ou decreto (Planalto, Diário Oficial), jornal da época (Hemeroteca Digital da Biblioteca Nacional), documento de acervo (Arquivo Nacional, Arquivo Edgard Leuenroth/Unicamp, CPDOC/FGV) ou depoimento registrado. O fluxo está em `docs/editorial/checagem.md`.

## 5. Página de fontes (`/001`)

De cima para baixo:
1. Tarja + selo `MEMÓRIA OPERÁRIA*`.
2. Carimbo com `Nº 001` e a data.
3. A foto em P&B, com o crédito e a licença logo abaixo, em Space Mono.
4. A frase (manchete).
5. O texto, de 3 a 5 parágrafos.
6. **FONTES**: lista numerada, primárias primeiro, cada item com instituição, link e "acessada em".
7. **CHECAGEM**: "Checado por X em DD MMM AAAA".
8. **CORREÇÕES**, só se houver.
9. Chamada "Mande pra quem trabalha com você", com link para a próxima e a anterior.
10. Rodapé: `PUKAS · A TEORIA VOLTA A SER ARMA*`.

## 6. Página de links (`/links`)

- Tarja grande no topo e a frase da última peça.
- Botões em blocos chapados, sem canto arredondado, com no mínimo 44px de altura:
  1. **Última Memória Operária, Nº NNN →** (automático: a peça publicada mais recente).
  2. **Manifesto →**
  3. **Todas as peças →** (a capa).
- Os botões vêm de uma lista em código (`src/data/links.ts`) mais a peça automática. Para adicionar "Última newsletter" depois, basta uma linha nessa lista.
- Não há rastreadores de terceiros. A medição de cliques vai para uma fase futura e, quando entrar, será sem cookies (por exemplo, Vercel Web Analytics).

## 7. Identidade aplicada

Segue a [v2.0](../design/identidade-visual.md): cinco cores como tokens, receitas Leitura e Agitação, Archivo (manchete com largura 62%, corpo em 18px), Space Mono e Anton só no carimbo. O grão vai só nos textos grandes e o corpo fica limpo. As fontes são auto-hospedadas.

## 8. Qualidade

- CI em todo PR: `astro check`, Vitest e `astro build`.
- Vitest cobre a lógica pura: ordenação, formatação, validações editoriais e contraste da paleta.
- HTML semântico, `lang="pt-BR"` e contraste conforme [paleta.md](../design/paleta.md).

## 9. Domínio

`pukas.lat`, que o fundador vai comprar. Até lá, o site fica em `*.vercel.app`, configurável por `PUBLIC_SITE_URL`.
