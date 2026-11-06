# Site da série Memória Operária — Plano de Implementação

> **Para agentes:** sub-skill obrigatória: superpowers:executing-plans (método escolhido: **nativo**). Os passos usam checkbox (`- [ ]`).

**Objetivo:** site estático do PUKAS com uma página de fontes por peça da Memória Operária, página de links da bio, manifesto público e RSS, tudo na identidade v2.0.

**Arquitetura:** Astro em saída estática. Cada peça é uma entrada da coleção `pecas` (MDX + frontmatter Zod). As regras editoriais (verdade, linguagem) são funções puras em `src/lib/`, testadas com Vitest e chamadas por uma porta única, `carregarPecas()`. Os estilos saem de `tokens.css`.

**Tech Stack:** Node 24 · npm · TypeScript `strict` · Astro (major atual, Content Layer API) · `@astrojs/mdx` · `@astrojs/rss` · `@fontsource-variable/archivo` (eixo `wdth`), `@fontsource/space-mono`, `@fontsource/anton` · Vitest · GitHub Actions · Vercel.

**Spec:** [`docs/specs/2026-11-06-site-memoria-operaria-design.md`](../specs/2026-11-06-site-memoria-operaria-design.md)

## Emenda (06/11/2026, depois da Tarefa 2)

O fundador definiu que o site é uma **plataforma** e que a **newsletter é a fonte editorial**. Valem estas trocas em todas as tarefas abaixo:

| Onde o plano diz | Passa a ser |
|---|---|
| coleção `pecas`, `src/content/pecas/NNN-slug.mdx` | coleção `newsletter`, `src/content/newsletter/memoria-operaria/NNN-slug.mdx`, com campo `serie: z.enum(['memoria-operaria'])` |
| tipo `Peca`, `carregarPecas`, `pecasPublicadas` | `Edicao`, `carregarEdicoes`, `edicoesPublicadas`. Os números são únicos **por série** |
| `caminhoPeca(n) → "/001"` | `caminhoEdicao(serie, n) → "/newsletter/memoria-operaria/001"` e `caminhoCurto(n) → "/001"` |
| `src/pages/[numero].astro` (página de fontes) | `src/pages/newsletter/[serie]/[numero].astro` (edição). `src/pages/[numero].astro` vira o redirecionamento curto, com `<meta http-equiv="refresh">` e `<link rel="canonical">` |
| capa lista as peças | capa mostra a última edição. A lista completa fica em `src/pages/newsletter/memoria-operaria/index.astro` |
| `/links`: "Última Memória Operária" | o mesmo botão, apontando para `caminhoEdicao` |
| RSS "PUKAS — Memória Operária" | o mesmo título. `link` usa `caminhoEdicao` |

O painel `/admin` fica fora deste plano (ADR-0002 pendente).

## Restrições globais

- Tokens: `--pau-brasil:#9E2A1E` `--tinta:#1C1A17` `--cal:#F1EDE4` `--ipe:#E0A526` `--verde-mata:#1A452C`. Nenhum hex fora de `tokens.css`.
- Receitas por classe no `<body>`: `.receita-leitura` (fundo Cal, texto Tinta, acento Pau-Brasil) e `.receita-agitacao` (fundo Pau-Brasil, texto Cal, apoio Tinta). Nunca misturar receitas na mesma página.
- Manchete: Archivo 900, `font-stretch: 62%`, caixa alta, `line-height: .86`. Corpo: Archivo 400, 18px, `line-height: 1.45`. Máquina: Space Mono 700. Anton só no `<Carimbo>`.
- Sem `border-radius`, gradiente ou `box-shadow` com desfoque. Grão só em manchete, nunca no corpo.
- Número no formato `Nº 001` (3 dígitos). Data no formato `05 NOV 2026`, sempre em UTC. URL da peça: `/001`.
- Rodapé fixo: `PUKAS · A TEORIA VOLTA A SER ARMA*`. Selo da série: `MEMÓRIA OPERÁRIA*`.
- Sem JavaScript no cliente e sem rastreadores.
- `site` vem de `PUBLIC_SITE_URL`, com fallback `https://pukas.vercel.app`.
- Commits em Conventional Commits, em português, com a linha `Co-Authored-By`.

## Foco de revisão

1. **Peça publicada sem prova:** falta fonte primária, licença da foto ou checagem. O build tem de falhar com uma mensagem que diga qual peça e o que falta. → Tarefa 4.
2. **Manchete longa demais:** com mais de 8 palavras, o build falha. Hífen e número contam como palavra. → Tarefa 4.
3. **Data em fuso errado:** `2026-11-09` não pode aparecer como `08 NOV`. → Tarefa 3.
4. **Zero peças publicadas** (todas em rascunho): a capa, `/links` e o RSS renderizam sem erro, com um estado vazio. → Tarefas 4, 6 e 7.
5. **Conteúdo largo no celular** (foto, tabela, link longo de fonte): nada estoura em 360px. → Tarefa 5 (`overflow-wrap: anywhere` nas fontes).

---

### Tarefa 1: Esqueleto Astro + TypeScript + CI

**Arquivos:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.nvmrc`, `src/pages/index.astro` (provisório), `.github/workflows/ci.yml`

**Produz:** os scripts `dev`, `build`, `preview`, `check` (`astro check`) e `test` (`vitest run`). `astro.config.mjs` com `site`, `integrations: [mdx()]` e saída estática.

- [ ] Criar o template mínimo do Astro na raiz, preservando `README.md`, `docs/`, `.github/` e as licenças. Adicionar `@astrojs/mdx`, `@astrojs/check`, `typescript` e `vitest`.
- [ ] `tsconfig.json` estende `astro/tsconfigs/strict`.
- [ ] CI em `pull_request` e em push na `main`: Node 24 com cache npm, depois `npm ci`, `check`, `test` e `build`.
- [ ] Rodar `npm run check && npm test -- --passWithNoTests && npm run build`. Esperado: tudo verde.
- [ ] Fazer o commit `chore: cria esqueleto Astro com TypeScript strict e CI`.

### Tarefa 2: Tokens v2.0 e contraste verificável

**Arquivos:** `src/styles/tokens.css`, `src/styles/base.css`, `src/lib/contraste.ts` · Testes: `src/lib/contraste.test.ts`, `src/styles/tokens.test.ts`

**Produz:**
- `razaoContraste(a: string, b: string): number` (luminância relativa da WCAG 2.x, com 2 casas decimais).
- As variáveis das 5 cores, mais `--fonte-manchete`, `--fonte-corpo`, `--fonte-maquina` e `--fonte-carimbo`, e a escala `--esp-1…8` (múltiplos de 4px).
- As classes `.receita-leitura` e `.receita-agitacao`.

- [ ] Escrever os testes:

```ts
expect(razaoContraste('#FFFFFF','#000000')).toBe(21);
expect(razaoContraste('#1C1A17','#F1EDE4')).toBeGreaterThanOrEqual(7);   // corpo Leitura
expect(razaoContraste('#F1EDE4','#9E2A1E')).toBeGreaterThanOrEqual(4.5); // Agitação
expect(razaoContraste('#E0A526','#1C1A17')).toBeGreaterThanOrEqual(4.5);
expect(razaoContraste('#E0A526','#1A452C')).toBeGreaterThanOrEqual(4.5);
expect(razaoContraste('#9E2A1E','#1C1A17')).toBeLessThan(3);             // proibido para texto
// tokens.test.ts: os 5 hex existem em tokens.css e nenhum outro hex aparece
```

- [ ] Rodar `npm test`. Esperado: FALHA.
- [ ] Implementar. As fontes entram por `@fontsource*`. `base.css` traz o reset, `*{border-radius:0}` e `prefers-reduced-motion`. Se algum par não alcançar o limite, **parar e reportar ao fundador**, sem mudar o hex.
- [ ] Rodar `npm test`. Esperado: PASSA. Commit: `feat(tokens): adiciona paleta v2.0, receitas e verificação de contraste`.

### Tarefa 3: Formatação e componentes de identidade

**Arquivos:** `src/lib/formato.ts`, `src/components/identidade/{Tarja,Carimbo,Selo,Grao}.astro` · Teste: `src/lib/formato.test.ts`

**Produz:**
- `formatarNumero(n: number): string`: `1 → "Nº 001"`, `42 → "Nº 042"`, `1234 → "Nº 1234"`.
- `caminhoPeca(n: number): string`: `1 → "/001"`.
- `formatarData(d: Date): string`: em UTC, `JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ`.
- `<Tarja variante?: 'cor' | 'tinta' | 'cal' tamanho?: 'p' | 'g' />`: bloco com "PUKAS" vazado, Archivo 900 a 62%.
- `<Carimbo numero: number data?: Date />`: borda dupla Pau-Brasil, `rotate(-4deg)`, "ARQUIVO POPULAR" / PUKAS em Anton / Nº.
- `<Selo texto: string />`: Space Mono 700, para o canto superior direito.
- `<Grao />`: filtro SVG que só se aplica dentro de `.manchete`.

- [ ] Testes de formatação: os casos acima, mais `formatarData(new Date('2026-11-09'))` dando `"09 NOV 2026"` e `new Date('2026-01-01')` dando `"01 JAN 2026"`.
- [ ] Rodar `npm test`. Esperado: FALHA. Implementar. Rodar `npm test && npm run check`. Esperado: PASSA.
- [ ] Commit: `feat(identidade): adiciona Tarja, Carimbo, Selo e formatação`.

### Tarefa 4: Coleção `pecas` e regras de verdade e linguagem

**Arquivos:** `src/content.config.ts`, `src/lib/pecas.ts`, `src/content/pecas/000-exemplo.mdx` (`rascunho: true`), `docs/editorial/checagem.md` · Teste: `src/lib/pecas.test.ts`

**Produz:**
- O esquema `pecas` com os campos da spec §4. `foto.arquivo` usa `image()`. `checagem` é opcional no esquema, mas obrigatória para publicar.
- O tipo `Peca`, compatível com `CollectionEntry<'pecas'>`.
- As funções:
  - `contarPalavras(frase: string): number`: separa por espaço, e hífen e número contam como palavra.
  - `validarPublicavel(p: Peca): string[]`: devolve a lista de problemas. Vazia quando está tudo certo. As mensagens são, exatamente: `"sem fonte primária"`, `"foto sem licença"`, `"foto sem crédito"`, `"sem checagem"`, `"manchete com N palavras (máx. 8)"`.
  - `validarNumerosUnicos(ps: Peca[]): void`: lança `Error("Número repetido: Nº 003 (a, b)")`.
  - `pecasPublicadas(ps: Peca[]): Peca[]`: remove rascunhos e ordena por `numero` decrescente.
  - `carregarPecas(): Promise<Peca[]>`: chama `getCollection`, depois `validarNumerosUnicos`, depois `validarPublicavel` em cada peça não-rascunho (lança `Error("Peça Nº 001: sem checagem; foto sem licença")`) e por fim `pecasPublicadas`. É a **única** porta para páginas e RSS.

- [ ] Testes:
  - `pecasPublicadas([]) → []`, rascunho excluído, ordem por número;
  - `contarPalavras('O 13º salário não foi presente') === 6`;
  - cada mensagem de `validarPublicavel` em isolamento;
  - uma peça completa devolve `[]`;
  - um número repetido lança erro com os dois ids.
- [ ] Rodar `npm test`. Esperado: FALHA. Implementar. Esperado: PASSA, e `npm run build` verde com só o exemplo em rascunho.
- [ ] Escrever `docs/editorial/checagem.md`:
  - o que é fonte primária (lista da spec §4);
  - o checklist: data confere em 2 fontes, número confere na fonte primária, foto com licença compatível e link funcionando;
  - a regra "o fato ganha da tese";
  - como registrar uma correção.
- [ ] Commit: `feat(pecas): adiciona coleção e regras editoriais de verdade e linguagem`.

### Tarefa 5: Layout e página de fontes `/NNN`

**Arquivos:** `src/layouts/Base.astro`, `src/components/layout/{Cabecalho,Rodape}.astro`, `src/styles/leitura.css`, `src/pages/[numero].astro`

**Consome:** `carregarPecas`, formatação e componentes de identidade.

**Produz:**
- `<Base titulo descricao receita: 'leitura' | 'agitacao' imagem?>`: `lang="pt-BR"`, Open Graph (com `og:image` igual à foto da peça quando houver), `rel="alternate"` para o RSS, e a classe da receita no `<body>`.
- `getStaticPaths` com `params.numero` igual a `caminhoPeca(n).slice(1)`.

- [ ] Montar a página na ordem da spec §5. As fontes vão em `<ol>`, primárias primeiro, com `overflow-wrap: anywhere`. A foto usa `<Image>` do Astro com `alt` igual a `foto.descricao`. `leitura.css` define `max-width: 68ch` e corpo de 18px.
- [ ] Para verificar, criar temporariamente uma peça completa de teste, rodar `npm run build && npm run preview` e abrir `/001` em 360px e em 1280px. Esperado: sem rolagem horizontal e com todas as seções presentes. Apagar a peça de teste.
- [ ] Commit: `feat(site): adiciona página de fontes da peça`.

### Tarefa 6: Capa, `/links` e `/manifesto`

**Arquivos:** `src/pages/index.astro`, `src/pages/links.astro`, `src/data/links.ts`, `src/pages/manifesto.astro`, `src/content/paginas/manifesto.mdx`, coleção `paginas` em `content.config.ts`. Mover `docs/produto/manifesto.md` para `docs/produto/fundamentos-interno.md`.

**Produz:** `links: { rotulo: string; href: string }[]` em `src/data/links.ts`, com os itens `Manifesto →` (`/manifesto`) e `Todas as peças →` (`/`).

- [ ] **Capa** (`/`, receita Leitura): Tarja, a frase e o carimbo da última peça, e a lista de todas as peças (número, frase, data). Se não houver nenhuma peça: "A primeira peça sai numa segunda-feira. Volte logo."
- [ ] **`/links`** (receita Agitação): Tarja grande. O primeiro botão é a última peça, `Última Memória Operária, Nº NNN →`, e depois vêm os itens de `links`. Cada botão é um `<a>` em bloco chapado Cal sobre Tinta, com no mínimo 44px. Se não houver peça, o primeiro botão some.
- [ ] **`/manifesto`:** rascunho escrito em linguagem de bar, com no máximo ~250 palavras, sem nenhum termo da lista proibida da spec §2. Fica com `rascunho: true` até o fundador aprovar no PR. Enquanto for rascunho, a rota mostra "Em breve.".
- [ ] Rodar `npm run check && npm run build`. Esperado: `dist/index.html`, `dist/links/index.html` e `dist/manifesto/index.html` gerados.
- [ ] Commit: `feat(site): adiciona capa, página de links e manifesto público`.

### Tarefa 7: RSS

**Arquivos:** `src/pages/rss.xml.ts`, `src/lib/rss.ts` · Teste: `src/lib/rss.test.ts`

**Produz:** `itensRss(ps: Peca[]): { title: string; pubDate: Date; description: string; link: string }[]`, com `link` igual a `caminhoPeca(n) + '/'` e `title` igual a `` `${formatarNumero(n)} — ${titulo}` ``.

- [ ] Testes: `itensRss([]) → []`, e os campos exatos de uma peça.
- [ ] Implementar com `@astrojs/rss`, título `PUKAS — Memória Operária` e `<language>pt-BR</language>`.
- [ ] Rodar `npm test && npm run build`. Esperado: `dist/rss.xml` válido. Commit: `feat(rss): adiciona feed das peças`.

### Tarefa 8: Deploy, domínio e critérios de pronto

- [ ] Criar o projeto no Vercel ligado a `mittari-dev/pukas`, com preview em todo PR. **Se pedir acesso à conta GitHub, parar e chamar o fundador.**
- [ ] Configurar `PUBLIC_SITE_URL`. Quando `pukas.lat` estiver comprado, apontar o DNS para o Vercel e atualizar a variável.
- [ ] Rodar o Lighthouse no celular em `/`, `/links` e numa peça de teste em preview. Esperado: Performance e Acessibilidade ≥ 95. Registrar no PR.
- [ ] Teste de recusa: um PR com uma peça sem checagem precisa **falhar** no CI com a mensagem da Tarefa 4. Fechar o PR sem merge.
- [ ] Atualizar o README e o roadmap. Commit: `docs: marca site da série como concluído`.
