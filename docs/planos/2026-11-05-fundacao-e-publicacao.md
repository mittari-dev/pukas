# Fundação + Publicação — Plano de Implementação

> **Substituído** em 06/11/2026 por [2026-11-06-site-memoria-operaria.md](2026-11-06-site-memoria-operaria.md).

**Objetivo:** site do PUKAS que publica a newsletter *Manifesto de Trincheira* a partir de MDX no Git, na identidade aprovada, com RSS e deploy automático.

**Arquitetura:** Astro em saída estática. O conteúdo é uma *Content Collection* `newsletter`, validada por Zod. A lógica pura (ordenação, formatação, validação, contraste) fica em `src/lib/`, testada com Vitest. Os componentes `.astro` só montam a página. Os estilos saem de um único `tokens.css`.

**Tech Stack:** Node 24 · npm · TypeScript `strict` · Astro (major atual, Content Layer API) · `@astrojs/mdx` · `@astrojs/rss` · `@fontsource/anton`, `@fontsource/space-mono`, `@fontsource/space-grotesk` · Vitest · GitHub Actions · Vercel.

**Spec:** [`docs/specs/2026-11-05-fundacao-e-publicacao-design.md`](../specs/2026-11-05-fundacao-e-publicacao-design.md)

## Restrições globais

- Cores de identidade: `--pau-brasil: #9E2A1E`, `--ipe: #E0A526`, `--verde-mata: #1A452C`. Cor funcional de leitura: `--cal: #F1EDE4`. Nenhum outro hex no código, fora `tokens.css`.
- Texto corrido em Cal sobre Verde-Mata. Ipê sobre Pau-Brasil só em texto com 24px ou mais. Pau-Brasil sobre Verde-Mata nunca em texto.
- Sem `border-radius`, sem gradientes, sem `box-shadow` com desfoque. Transições secas e `prefers-reduced-motion` respeitado.
- `lang="pt-BR"`. Datas exibidas no formato `05 NOV 2026`, sempre em UTC.
- Número de arquivo no formato `Nº 001`, com três dígitos e zeros à esquerda.
- Nenhum JavaScript no cliente nesta fase, porque todas as páginas são estáticas.
- Sem domínio por enquanto: `site` vem de `PUBLIC_SITE_URL`, com fallback `https://pukas.vercel.app`.
- Commits em Conventional Commits, em português, com a linha `Co-Authored-By` do agente.

## Foco de revisão

1. **Número de edição duplicado:** dois arquivos com o mesmo `numero` precisam quebrar o build com uma mensagem clara. → Tarefa 4, `validarNumerosUnicos`.
2. **Data em fuso errado:** `data: 2026-11-05` não pode virar `04 NOV` no Brasil. → Tarefa 3, teste de `formatarData` em UTC.
3. **Nenhuma edição publicada** (todas em rascunho): o arquivo e o RSS precisam renderizar vazios, sem erro. → Tarefa 4, `edicoesPublicadas([])`. → Tarefa 6, estado vazio.
4. **Slug fora do padrão** (acento, espaço, maiúscula): o build precisa falhar antes de gerar uma URL quebrada. → Tarefa 4, `validarSlug`.
5. **Conteúdo largo no celular** (imagem grande, bloco de código, tabela): nada pode estourar a largura. → Tarefa 5, regras de `prose.css` e verificação em 360px.

---

### Tarefa 1: Esqueleto Astro + TypeScript + CI

**Arquivos:**
- Criar: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro` (provisório), `.github/workflows/ci.yml`, `.nvmrc` (`24`)

**Interfaces:**
- Produz os scripts `npm run dev`, `npm run build`, `npm run check` (`astro check`), `npm test` (`vitest run`) e `astro.config.mjs` com `site`, `integrations: [mdx()]` e `output: 'static'`.

- [ ] **Passo 1:** Criar o projeto com o template mínimo do Astro na raiz, sem sobrescrever `README.md`, `docs/` nem `.github/`. Adicionar `@astrojs/mdx`, `@astrojs/check`, `typescript` e `vitest`.
- [ ] **Passo 2:** Usar `tsconfig.json` estendendo `astro/tsconfigs/strict`.
- [ ] **Passo 3:** Montar a CI (`ci.yml`) em `pull_request` e em `push` na `main`, com `actions/setup-node` (Node 24, cache npm), `npm ci`, `npm run check`, `npm test` e `npm run build`.
- [ ] **Passo 4:** Rodar `npm run check && npm test -- --passWithNoTests && npm run build`. Esperado: tudo verde, com `dist/index.html` gerado.
- [ ] **Passo 5:** Fazer o commit `chore: cria esqueleto Astro com TypeScript strict e CI`.

### Tarefa 2: Tokens de design e contraste verificável

**Arquivos:**
- Criar: `src/styles/tokens.css`, `src/styles/base.css`, `src/lib/contraste.ts`
- Teste: `src/lib/contraste.test.ts`, `src/styles/tokens.test.ts`

**Interfaces:**
- Produz `razaoContraste(hexA: string, hexB: string): number`, pela fórmula de luminância relativa da WCAG 2.x, com o resultado arredondado para 2 casas.
- Produz as variáveis CSS `--pau-brasil`, `--ipe`, `--verde-mata`, `--cal`, `--fonte-display` (`'Anton'`), `--fonte-mono` (`'Space Mono'`), `--fonte-corpo` (`'Space Grotesk'`) e a escala `--esp-1` … `--esp-8` (múltiplos de 4px).

- [ ] **Passo 1: Escrever os testes que falham**

```ts
// contraste.test.ts
expect(razaoContraste('#FFFFFF', '#000000')).toBe(21);
expect(razaoContraste('#F1EDE4', '#1A452C')).toBeGreaterThanOrEqual(7);   // texto corrido (AAA)
expect(razaoContraste('#E0A526', '#1A452C')).toBeGreaterThanOrEqual(4.5); // Ipê pequeno
expect(razaoContraste('#E0A526', '#9E2A1E')).toBeGreaterThanOrEqual(3);   // Ipê grande
expect(razaoContraste('#9E2A1E', '#1A452C')).toBeLessThan(3);             // proibido para texto
// tokens.test.ts — lê tokens.css e garante que os 4 hex existem e que nenhum outro hex aparece
```

- [ ] **Passo 2:** Rodar `npm test`. Esperado: FALHA, porque `razaoContraste` não existe.
- [ ] **Passo 3:** Implementar `razaoContraste` e escrever `tokens.css`. Em `base.css`: reset; `body` com fundo `var(--verde-mata)`, cor `var(--cal)` e fonte `var(--fonte-corpo)`; `*{border-radius:0}`; e `@media (prefers-reduced-motion: reduce)` zerando as transições. Importar as fontes por `@fontsource/*`, que vão auto-hospedadas no build.
- [ ] **Passo 4:** Rodar `npm test`. Esperado: PASSA. Se algum par da paleta não alcançar o limite, **parar e reportar ao fundador**, sem ajustar o hex por conta própria.
- [ ] **Passo 5:** Fazer o commit `feat(tokens): adiciona paleta, tipografia e verificação de contraste`.

### Tarefa 3: Formatação e componentes de identidade

**Arquivos:**
- Criar: `src/lib/formato.ts`, `src/components/identidade/Grao.astro`, `Carimbo.astro`, `Faixa.astro`, `NumeroArquivo.astro`
- Teste: `src/lib/formato.test.ts`

**Interfaces:**
- Produz `formatarNumeroArquivo(n: number): string`: `1 → "Nº 001"`, `42 → "Nº 042"`, `1234 → "Nº 1234"`.
- Produz `formatarData(d: Date): string`: `new Date('2026-11-05') → "05 NOV 2026"`, calculado em UTC com os meses `JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ`.
- Produz os componentes `<Grao />` (SVG `feTurbulence` fixo, `aria-hidden`, `pointer-events:none`, opacidade 0.3, `mix-blend-mode: overlay`), `<Carimbo texto: string rotacao?: number />` (borda de 3px em Ipê, rotação padrão de 8°, Space Mono), `<Faixa>` (slot; fundo Pau-Brasil, texto Ipê com 24px ou mais, `rotate(-3deg)`, sangrando pelas bordas) e `<NumeroArquivo n: number />`.

- [ ] **Passo 1:** Escrever os testes de `formatarNumeroArquivo` (os 3 casos acima e `0 → "Nº 000"`) e de `formatarData`, incluindo `new Date('2026-01-01')` → `"01 JAN 2026"`, para pegar o erro de fuso.
- [ ] **Passo 2:** Rodar `npm test`. Esperado: FALHA.
- [ ] **Passo 3:** Implementar `formato.ts` (`getUTCDate`, `getUTCMonth`) e os 4 componentes.
- [ ] **Passo 4:** Rodar `npm test && npm run check`. Esperado: PASSA.
- [ ] **Passo 5:** Fazer o commit `feat(identidade): adiciona grão, carimbo, faixa e número de arquivo`.

### Tarefa 4: Coleção `newsletter` e regras editoriais

**Arquivos:**
- Criar: `src/content.config.ts`, `src/lib/edicoes.ts`, `src/content/newsletter/000-manifesto.mdx`
- Teste: `src/lib/edicoes.test.ts`

**Interfaces:**
- Produz o esquema da coleção `newsletter` (loader `glob`, padrão `**/*.mdx`): `titulo: string (1–120)`, `numero: number int ≥ 0`, `data: date`, `resumo: string (1–280)`, `autoria: string` (padrão `"Redação PUKAS"`), `tags: string[]` (padrão `[]`), `rascunho: boolean` (padrão `false`).
- Produz o tipo `Edicao = { id: string; data: { titulo; numero; data: Date; resumo; autoria; tags; rascunho } }`, compatível com `CollectionEntry<'newsletter'>`.
- Produz:
  - `edicoesPublicadas(edicoes: Edicao[]): Edicao[]`: remove os rascunhos e ordena por `data` decrescente, com desempate por `numero` decrescente.
  - `validarNumerosUnicos(edicoes: Edicao[]): void`: lança `Error("Número de edição repetido: Nº 003 (a.mdx, b.mdx)")`.
  - `validarSlug(id: string): void`: aceita `/^[a-z0-9]+(-[a-z0-9]+)*$/` e lança erro em qualquer outro caso.
  - `carregarEdicoes(): Promise<Edicao[]>`: chama `getCollection('newsletter')`, roda as duas validações e devolve `edicoesPublicadas`. É a **única** porta de entrada para as páginas e o RSS.

- [ ] **Passo 1:** Escrever os testes:
  - `edicoesPublicadas([])` → `[]`
  - um rascunho é excluído
  - a ordem por data vem antes do desempate por número
  - `validarNumerosUnicos` lança erro com os dois ids na mensagem
  - `validarSlug('manifesto-de-trincheira')` passa
  - `validarSlug('Manifesto')`, `('ação')`, `('a b')` e `('a--b')` lançam erro
- [ ] **Passo 2:** Rodar `npm test`. Esperado: FALHA.
- [ ] **Passo 3:** Implementar. A edição `000-manifesto.mdx` usa `numero: 0`, `titulo: "O Manifesto"`, `data: 2026-11-05`, um `resumo` com a frase do Objetivo Final, e o corpo copiado de `docs/produto/manifesto.md` §1 (I–IV), sem mudar o texto.
- [ ] **Passo 4:** Rodar `npm test && npm run check`. Esperado: PASSA.
- [ ] **Passo 5:** Fazer o commit `feat(newsletter): adiciona coleção, validações e edição Nº 000`.

### Tarefa 5: Layouts e página de leitura

**Arquivos:**
- Criar: `src/layouts/Base.astro`, `src/layouts/Leitura.astro`, `src/components/layout/Cabecalho.astro`, `src/components/layout/Rodape.astro`, `src/styles/prose.css`, `src/pages/newsletter/[slug].astro`

**Interfaces:**
- Consome `carregarEdicoes`, `formatarData`, `formatarNumeroArquivo` e os componentes de identidade.
- Produz `<Base titulo: string descricao: string>`, que monta `<html lang="pt-BR">`, os metadados, Open Graph (`og:title`, `og:description`, `og:type`), o link `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`, `<Grao />`, o cabeçalho e o rodapé.
- Produz `<Leitura edicao: Edicao proxima?: Edicao>`, com `<article>`, o cabeçalho de arquivo (`NumeroArquivo`, `<time datetime>`, autoria, `Carimbo` "MANIFESTO DE TRINCHEIRA"), o corpo `.prose` e o link para a próxima edição.
- `[slug].astro`: `getStaticPaths` a partir de `carregarEdicoes()`, um caminho por `edicao.id`.

- [ ] **Passo 1:** Montar `prose.css`:
  - `max-width: 68ch`
  - corpo em `1.125rem` com `line-height: 1.65` e cor `var(--cal)`
  - `h2` e `h3` em `var(--fonte-display)` caixa alta, cor `var(--ipe)`
  - links em `var(--ipe)` com sublinhado
  - `img, video { max-width: 100%; height: auto }`
  - `pre, table { overflow-x: auto; display: block }`
  - `blockquote` com borda esquerda de 4px em `var(--pau-brasil)`
- [ ] **Passo 2:** Implementar os layouts e a rota.
- [ ] **Passo 3:** Rodar `npm run check && npm run build`. Esperado: PASSA, com `dist/newsletter/000-manifesto/index.html` gerado.
- [ ] **Passo 4:** Rodar `npm run preview`. Abrir `/newsletter/000-manifesto` em 360px e em 1280px. Esperado: sem rolagem horizontal, texto Cal sobre Verde-Mata e grão visível.
- [ ] **Passo 5:** Fazer o commit `feat(newsletter): adiciona layouts e página de leitura`.

### Tarefa 6: Capa, arquivo de edições e /manifesto

**Arquivos:**
- Criar: `src/pages/newsletter/index.astro`, `src/pages/manifesto.astro`
- Modificar: `src/pages/index.astro` (substitui o provisório)

**Interfaces:**
- Consome `carregarEdicoes`, `<Base>`, `<Leitura>` e os componentes de identidade.

- [ ] **Passo 1:** Montar a capa (`/`):
  - "PUKAS" em `--fonte-display`
  - `<Faixa>` com "Órgão de Mídia & Inteligência Latino-Americana"
  - a frase "A teoria volta a ser arma."
  - as 3 edições mais recentes, cada uma com `NumeroArquivo`, título, data e resumo
  - link para `/newsletter` e para `/manifesto`
- [ ] **Passo 2:** Montar o arquivo (`/newsletter`) com a lista completa. Quando a lista vier vazia, mostrar o texto "Nenhuma edição publicada ainda." Para testar, marcar temporariamente a 000 como `rascunho: true`, rodar o build e conferir. Depois reverter.
- [ ] **Passo 3:** Montar `/manifesto`, que renderiza a entrada `000-manifesto` com `<Leitura>`.
- [ ] **Passo 4:** Rodar `npm run check && npm run build`. Esperado: PASSA, com `dist/index.html`, `dist/newsletter/index.html` e `dist/manifesto/index.html` gerados.
- [ ] **Passo 5:** Fazer o commit `feat(site): adiciona capa, arquivo de edições e página do manifesto`.

### Tarefa 7: RSS

**Arquivos:**
- Criar: `src/pages/rss.xml.ts`, `src/lib/rss.ts`
- Teste: `src/lib/rss.test.ts`

**Interfaces:**
- Consome `carregarEdicoes`.
- Produz `itensRss(edicoes: Edicao[]): { title: string; pubDate: Date; description: string; link: string }[]`, com `link` igual a `/newsletter/${id}/` e `title` igual a `` `${formatarNumeroArquivo(numero)} — ${titulo}` ``.

- [ ] **Passo 1:** Escrever os testes: `itensRss([])` → `[]`, e uma edição gera o `link` e o `title` exatos.
- [ ] **Passo 2:** Rodar `npm test`. Esperado: FALHA.
- [ ] **Passo 3:** Implementar `rss.ts` e `rss.xml.ts` com `@astrojs/rss`. Usar `title: "PUKAS — Manifesto de Trincheira"`, `site: context.site` e `customData: <language>pt-BR</language>`.
- [ ] **Passo 4:** Rodar `npm test && npm run build`, depois `grep -c "<item>" dist/rss.xml`. Esperado: `1`.
- [ ] **Passo 5:** Fazer o commit `feat(rss): adiciona feed da newsletter`.

### Tarefa 8: Deploy e critérios de pronto

**Arquivos:**
- Modificar: `README.md` (Status e seção "Rodando localmente"), `docs/roadmap.md`

- [ ] **Passo 1:** Criar o projeto no Vercel ligado a `mittari-dev/pukas`: framework Astro, build `npm run build`, saída `dist`, preview em todo PR. **Se o Vercel pedir acesso à conta GitHub, parar e pedir ao fundador.**
- [ ] **Passo 2:** Configurar `PUBLIC_SITE_URL` com a URL `*.vercel.app` que for atribuída, em Production e Preview.
- [ ] **Passo 3:** Rodar o Lighthouse no celular em `/newsletter/000-manifesto`. Esperado: Performance ≥ 95 e Acessibilidade ≥ 95. Registrar os números no PR.
- [ ] **Passo 4:** Validar o fluxo da spec §4 de ponta a ponta. Abrir um branch `texto/teste-fluxo` com uma edição `rascunho: true` e conferir que o preview é gerado e que a edição não aparece no arquivo nem no RSS. Fechar o PR sem merge.
- [ ] **Passo 5:** Atualizar o README e o roadmap. Os subprojetos 0 e 1 passam a ✅. Fazer o commit `docs: marca Fundação e Publicação como concluídas`.
