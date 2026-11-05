# Spec — Fundação + Publicação (subprojetos 0 e 1)

- **Status:** Rascunho, aguardando revisão do fundador
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

- **Paleta:** Pau-Brasil `#9E2A1E`, Ipê `#E0A526` e Verde-Mata `#1A452C`, com as regras de contraste de [paleta.md](../design/paleta.md).
- **Fontes:** Anton (display), Space Mono (metadados) e Space Grotesk (corpo), servidas localmente em `public/fonts/`. Não dependemos do Google em tempo de execução.
- **Grão:** uma camada SVG `feTurbulence` fixa sobre a página, com `pointer-events: none`. Pesa zero em imagem.
- **Movimento:** transições secas e sem easing orgânico. `prefers-reduced-motion` é respeitado.

## 6. Qualidade

- **CI** (GitHub Actions, em todo PR): `npm ci`, `astro check` e `astro build`.
- **Vitest** só para lógica pura, como ordenação de edições ou formatação de data e número de arquivo.
- **Acessibilidade:** contraste de acordo com a tabela da paleta, HTML semântico (`<article>`, `<time>`, `<nav>`) e `lang="pt-BR"`.

## 7. Questões em aberto (decidir antes do plano)

1. **Superfície de leitura longa.** Texto Ipê sobre Verde-Mata por muitos parágrafos cansa. Proposta: o corpo de texto da newsletter usa um neutro funcional, Cal `#F1EDE4` com texto Verde-Mata, e a identidade fica nas bordas (cabeçalho, carimbos e faixas).
2. **Envio por e-mail (Fase 1.2).** Proposta: usar o Resend, com formulário de inscrição e envio da edição. O RSS cobre a Fase 1.
3. **Domínio.** Qual domínio? Exemplos: `pukas.org`, `pukas.lat`.
4. **Licença do conteúdo e do código.** Uma sugestão é CC BY-SA para os textos e AGPL para o código, coerente com "propriedade popular". A decisão é do fundador.
5. **Visibilidade do repositório.** O repositório é privado por enquanto. Tornar público quando lançar?
