# Spec — Fundação + Publicação (subprojetos 0 e 1)

- **Status:** ~~Aprovada em 05/11/2026~~ **Substituída** em 06/11/2026 por [2026-11-06-site-memoria-operaria-design.md](2026-11-06-site-memoria-operaria-design.md). O foco mudou da newsletter para a série Memória Operária, e entrou a identidade v2.0.
- **Data:** 05/11/2026
- **Depende de:** [ADR-0001](../decisoes/ADR-0001-linguagem-e-stack.md)

## 1. Objetivo

Colocar o PUKAS na rua com voz pública: um site que publica a newsletter **Manifesto de Trincheira**, na identidade visual aprovada, e que serve de base para os dossiês e os módulos interativos.

**Pronto quando:**

1. Um texto escrito em MDX, depois de um PR aprovado, aparece publicado em `/newsletter/<slug>` no domínio de produção.
2. A página de leitura passa no Lighthouse com Performance ≥ 95 e Acessibilidade ≥ 95 no celular.
3. Leitores conseguem acompanhar os textos por RSS.
4. A identidade (paleta E, tipografia, grão, carimbos) está aplicada a partir de tokens únicos e reaproveitáveis.

## 2. Fora de escopo (agora)

- Envio de e-mail da newsletter. Fica para a Fase 1.2, ver §7.
- Dossiês (`/dossie/:id`), módulos interativos, contas de usuário, comentários e CMS.
- Versão em espanhol. A estrutura de rotas já prevê `/es/`, mas não existe tradução.

## 3. Arquitetura

```
pukas/
├─ src/
│  ├─ content/
│  │  ├─ config.ts            # esquemas das coleções (Zod)
│  │  └─ newsletter/          # um .mdx por edição
│  ├─ styles/
│  │  ├─ tokens.css           # paleta, tipografia, espaçamento — fonte única
│  │  ├─ base.css             # reset, tipografia base, grão global
│  │  └─ prose.css            # leitura longa
│  ├─ components/
│  │  ├─ identidade/          # Carimbo, Faixa, NumeroArquivo, Grao
│  │  └─ layout/              # Cabecalho, Rodape
│  ├─ layouts/
│  │  ├─ Base.astro           # <html>, fontes, metadados, OG
│  │  └─ Leitura.astro        # página de texto longo
│  └─ pages/
│     ├─ index.astro          # capa: manifesto curto + últimas edições
│     ├─ manifesto.astro
│     ├─ newsletter/
│     │  ├─ index.astro       # arquivo de edições
│     │  └─ [slug].astro
│     └─ rss.xml.ts
├─ public/                    # favicon, fontes locais, imagens estáticas
├─ docs/                      # specs, ADRs, design (este arquivo)
└─ .github/                   # CI, templates, imagens do README
```

### Unidades e responsabilidades

| Unidade | Faz | Depende de |
|---|---|---|
| `tokens.css` | Define todas as cores, fontes e escalas como variáveis CSS | — |
| `components/identidade/*` | Elementos-assinatura do manual (carimbo, faixa inclinada, número de arquivo, grão) | `tokens.css` |
| `content/config.ts` | Esquema de cada edição: `titulo`, `numero`, `data`, `resumo`, `autoria`, `tags`, `rascunho` | Zod (via Astro) |
| `Leitura.astro` | Monta a página de texto: cabeçalho de arquivo, corpo `prose`, rodapé com próxima edição | tokens, identidade |
| `rss.xml.ts` | Gera o feed a partir da coleção, ignorando rascunhos | coleção `newsletter` |

## 4. Fluxo de publicação

1. Abrir um branch `texto/<slug>`.
2. Criar `src/content/newsletter/<slug>.mdx` com o frontmatter.
3. Abrir o PR. O CI roda `astro check` e o build, e o Vercel gera um *preview* do texto.
4. Revisar no preview e fazer o merge na `main`. O deploy de produção é automático.

Se o frontmatter estiver incompleto, o esquema Zod quebra o build e o texto não vai ao ar. Um campo `rascunho: true` mantém o texto fora das listagens e do RSS.

## 5. Identidade aplicada

- **Paleta:** Pau-Brasil `#9E2A1E`, Ipê `#E0A526` e Verde-Mata `#1A452C`, com as regras de contraste de [paleta.md](../design/paleta.md). Texto corrido em Cal `#F1EDE4` sobre Verde-Mata (§7).
- **Fontes:** Anton (display), Space Mono (metadados) e Space Grotesk (corpo), servidas localmente em `public/fonts/`. Não dependemos do Google em tempo de execução.
- **Grão:** uma camada SVG `feTurbulence` fixa sobre a página, com `pointer-events: none`. Pesa zero em imagem.
- **Movimento:** transições secas e sem easing orgânico. `prefers-reduced-motion` é respeitado.

## 6. Qualidade

- **CI** (GitHub Actions, em todo PR): `npm ci`, `astro check` e `astro build`.
- **Vitest** só para lógica pura, como ordenação de edições ou formatação de data e número de arquivo.
- **Acessibilidade:** contraste de acordo com a tabela da paleta, HTML semântico (`<article>`, `<time>`, `<nav>`) e `lang="pt-BR"`.

## 7. Decisões (05/11/2026)

1. **Superfície de leitura longa:** fundo **Verde-Mata** `#1A452C` com texto em **Cal** `#F1EDE4` (contraste de ~8,6:1). O Cal entra como cor funcional, só para o texto corrido. Ipê e Pau-Brasil ficam para títulos, carimbos e faixas.
2. **Envio por e-mail:** pelo **Resend**, na Fase 1.2. Na Fase 1, o RSS cobre o acompanhamento.
3. **Domínio:** ainda não há. A Fase 1 publica no subdomínio `*.vercel.app`. Quando o domínio for definido, entram a URL canônica e o feed com o endereço final.
4. **Licença:** **AGPL-3.0** para o código (`LICENSE`) e **CC BY-SA 4.0** para os textos e o conteúdo editorial (`LICENSE-CONTEUDO.md`).
5. **Visibilidade do repositório:** continua privado. A decisão fica para o lançamento.
