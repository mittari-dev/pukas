<p align="center">
  <img src=".github/assets/banner.png" alt="PUKAS. Direito nenhum caiu do céu. Foi luta. Memória Operária." width="100%">
</p>

# PUKAS — Os Vermelhos

*Puka* é "vermelho" em quéchua. O PUKAS é um órgão de mídia latino-americano que fala como conversa de bar: simples, denso e sempre com a fonte à vista.

> **O fato ganha da tese.** Toda informação tem fonte. Se a gente errar, corrige em público.

---

## Status

🟡 **Núcleo do site pronto na branch `feat/site-memoria-operaria`.** Falta o deploy e a primeira edição real.

| Seção | Status |
|---|---|
| Newsletter **Memória Operária** (`/newsletter/memoria-operaria/001`) + endereço curto `/001` | ✅ código · ⏳ primeira edição |
| Página da bio (`/links`) | ✅ |
| Manifesto público (`/manifesto`) | ✅ código · ⏳ texto aguarda aprovação |
| Capa e RSS | ✅ |
| Deploy (`pukas.lat`) | ⏳ |
| Painel `/admin`, gerador do carrossel, Raio-X, dossiês, documentários, loja | ⚪ ver o [roadmap](docs/roadmap.md) |

## Como uma edição vai ao ar

1. Copie `src/content/newsletter/memoria-operaria/000-exemplo.mdx` para `001-<assunto>.mdx` e preencha: frase, texto, foto (com crédito e licença), fontes e checagem.
2. Siga o [guia de checagem](docs/editorial/checagem.md).
3. Abra um PR. **O build recusa** a edição sem fonte primária, sem licença ou crédito da foto, sem checagem ou com manchete de mais de 8 palavras.
4. Depois do merge, a edição aparece em `/newsletter/memoria-operaria/001`, na capa, em `/links` e no RSS.

## Rodando localmente

Requisito: Node 24.

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # regras editoriais, formatação, contraste da paleta
npm run check    # tipos
npm run build    # site estático em dist/
```

## Stack

TypeScript (`strict`) · **Astro**, com saída estática e sem JavaScript no cliente · conteúdo em **MDX no Git**, validado por esquema · CSS com tokens · Vitest · GitHub Actions. O porquê está no [ADR-0001](docs/decisoes/ADR-0001-linguagem-e-stack.md).

## Identidade (v2.0)

| Pau-Brasil | Tinta | Cal | Ipê | Verde-Mata |
|:-:|:-:|:-:|:-:|:-:|
| `#9E2A1E` | `#1C1A17` | `#F1EDE4` | `#E0A526` | `#1A452C` |
| marca | texto | papel | destaque | técnico |

A marca é a **Tarja**. A tipografia usa **Archivo** (manchete comprimida), **Space Mono** e **Anton** (só no carimbo). O manual está em [`docs/design/identidade-visual.md`](docs/design/identidade-visual.md).

## Estrutura

```
src/
├─ content/newsletter/memoria-operaria/   uma edição = um arquivo .mdx
├─ content/paginas/                        manifesto
├─ lib/                                    regras puras + testes (edicoes, formato, contraste, rss)
├─ components/identidade/                  Tarja, Carimbo, Selo, Grão
├─ layouts/ · pages/ · styles/ · data/links.ts
docs/
├─ specs/ · planos/ · decisoes/           spec → plano → código
├─ design/                                 identidade v2.0 + originais
├─ editorial/checagem.md                   compromisso com a verdade
└─ produto/fundamentos-interno.md         texto teórico de origem (não publicar)
```

## Licença

- **Código:** [AGPL-3.0](LICENSE).
- **Textos e conteúdo editorial:** [CC BY-SA 4.0](LICENSE-CONTEUDO.md).

## Como trabalhamos

Spec → plano → implementação, uma seção por vez, e toda mudança entra por PR. Veja o [`CONTRIBUTING.md`](CONTRIBUTING.md).
