# Spec — Site da série Memória Operária (fase 1)

- **Status:** Aprovada em conversa (desenho em 3 partes + página de links). Aguarda revisão escrita.
- **Data:** 06/11/2026
- **Substitui:** [2026-11-05-fundacao-e-publicacao-design.md](2026-11-05-fundacao-e-publicacao-design.md)
- **Depende de:** [ADR-0001](../decisoes/ADR-0001-linguagem-e-stack.md) · [Identidade v2.0](../design/identidade-visual.md)

## 0. Contexto: o site é uma plataforma, e esta spec é o núcleo dela

```
pukas.lat
├─ /                                     capa da plataforma           ← esta spec
├─ /newsletter/memoria-operaria/001      edição completa + fontes      ← esta spec
├─ /001                                  endereço curto → edição       ← esta spec
├─ /links                                página temática da bio        ← esta spec
├─ /manifesto                            manifesto público             ← esta spec
├─ /admin                                painel com login              depois (ADR-0002 pendente)
├─ /dossies · /documentarios · /loja     seções futuras                depois
```

**Fluxo editorial:** a **newsletter é a fonte**. Cada edição da Memória Operária conta o que a classe já conquistou, o que ainda está batalhando e para onde está indo, com o texto completo e as fontes. Da edição nasce o **carrossel** de 4 a 6 imagens, que chama para o link da bio. O link da bio leva para `/links`, e de lá para a última edição.

Neste documento, "peça" e "edição" são a mesma coisa: uma edição da newsletter Memória Operária.

## 1. Objetivo

Lançar a série **Memória Operária**: uma edição da newsletter no site e um carrossel no Instagram toda **segunda-feira**, por 10 semanas, com **credibilidade desde o primeiro dia**. Cada edição traz as suas fontes. O núcleo é pequeno, mas já é a infraestrutura da plataforma.

**Por quê:** o que separa o PUKAS de uma página de meme é o dado verificável. Peça política sem fonte é alvo fácil de "fake news". Com a fonte visível, a resposta já está pronta.

**Pronto quando:**

1. Uma edição escrita num arquivo MDX, depois de aprovada por PR, aparece em `pukas.lat/newsletter/memoria-operaria/001`, com as fontes, o crédito da foto e o registro de checagem. O endereço `pukas.lat/001` leva até ela.
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
| `/` | Capa: Tarja, a frase da última edição, o arquivo da série, link para o manifesto | Leitura |
| `/newsletter/memoria-operaria/001`… | **Edição completa**: texto e fontes | Leitura |
| `/newsletter/memoria-operaria` | Arquivo da série | Leitura |
| `/001`, `/002`… | Endereço curto impresso no carrossel. Redireciona para a edição | — |
| `/links` | Página da bio do Instagram: última peça (automática), manifesto, arquivo | Agitação |
| `/manifesto` | Manifesto público curto em linguagem de rua (rascunho do Claude, aprovado pelo fundador) | Leitura |
| `/rss.xml` | Feed das peças | — |

### Fica de fora (agora)

- **Painel de administrador** (`/admin`, com login e senha). A ferramenta fica para o ADR-0002. Até lá, publica-se por PR.
- Outras séries da newsletter, dossiês, documentários, Raio-X (perto do mês 3), loja e impressos (ver o roadmap).
- Envio da newsletter por e-mail (Resend, numa fase posterior).
- **Gerador automático dos slides do carrossel.** Tem plano próprio, logo depois do site.
- O manifesto antigo (vanguarda, hegemonia) **não é publicado**. Vira `docs/produto/fundamentos-interno.md`.

## 4. Uma peça = um arquivo

`src/content/newsletter/memoria-operaria/001-<slug>.mdx`. O frontmatter guarda os dados estruturados e o corpo guarda o texto da edição.

| Campo | Tipo | Regra |
|---|---|---|
| `serie` | `'memoria-operaria'` | Por enquanto existe só uma série. A lista cresce quando chegarem outras |
| `numero` | inteiro ≥ 1 | Único dentro da série. A URL é `/newsletter/<serie>/` + número com 3 dígitos |
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

## 5. Página da edição (`/newsletter/memoria-operaria/001`)

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
