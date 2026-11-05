<p align="center">
  <img src=".github/assets/banner.png" alt="PUKAS — Os Vermelhos. Órgão de Mídia &amp; Inteligência Latino-Americana" width="100%">
</p>

# PUKAS — Os Vermelhos

**Órgão de Mídia & Inteligência Latino-Americana.**

*Puka* é "vermelho" em quéchua. O PUKAS faz a ponte entre o rigor metodológico-científico e a agitação de massas: teses inéditas, dossiês de alta densidade, ficção incômoda e ferramentas de dados próprias, sem depender de Big Tech.

> A teoria volta a ser arma.

---

## Status

🟡 **Fase 0 — Fundação.** A spec foi aprovada e o plano de implementação está em preparação. Ainda não existe código de produto.

| Subprojeto | Status |
|---|---|
| 0 · Fundação | 🟡 Plano em preparação |
| 1 · Publicação (newsletter *Manifesto de Trincheira*) | 🟡 Plano em preparação |
| 2 · Dossiê | ⚪ |
| 3 · Módulos interativos | ⚪ |
| 4 · Produção para redes | ⚪ |

Detalhes em [`docs/roadmap.md`](docs/roadmap.md).

## O que vai existir

**Eixo de Vanguarda**
- **Dossiê Quinzenal:** peça audiovisual imersiva + ensaio em página temática própria (`/dossie/:id`).
- **Manifesto de Trincheira:** newsletter de teses autorais (`/newsletter/:id`).
- **Conto-Fronteira:** ficção mensal.

**Eixo de Reação**
- **Carrossel-Manifesto** e **Pílulas de Reação** para as redes.

**Módulos interativos**
- Raio-X de Classe · Observatório de Contratos e Poder · Simulador Macroeconômico · Dicionário de Trincheira.

## Stack

| | |
|---|---|
| Linguagem | **TypeScript** (`strict`) |
| Framework | **Astro**: HTML puro por padrão, JavaScript só nas ilhas interativas |
| Conteúdo | **MDX em Git**, validado por esquemas |
| Interatividade | React · Three.js · D3, só onde for usado |
| Estilo | CSS puro com tokens |
| Hospedagem | Saída estática, no Vercel |

O porquê de cada escolha está em [ADR-0001](docs/decisoes/ADR-0001-linguagem-e-stack.md).

## Identidade

| Pau-Brasil | Ipê | Verde-Mata |
|:-:|:-:|:-:|
| `#9E2A1E` | `#E0A526` | `#1A452C` |
| Madeira que deu nome ao país | Ipê-amarelo, chita, festa popular | Mata Atlântica |

Tipografia: **Anton** (display) · **Space Mono** (metadados) · **Space Grotesk** (corpo).
Manual completo: [`docs/design/identidade-visual.md`](docs/design/identidade-visual.md).

## Estrutura do repositório

```
pukas/
├─ docs/
│  ├─ produto/       manifesto, posicionamento, modelo editorial
│  ├─ design/        identidade visual, paleta, canvas das paletas
│  ├─ decisoes/      ADRs
│  ├─ specs/         especificação de cada subprojeto
│  └─ roadmap.md
├─ .github/          templates de issue e PR, imagens
└─ CONTRIBUTING.md   fluxo de trabalho e convenções
```

O código (`src/`) entra com o plano de implementação da Fundação.

## Licença

- **Código:** [AGPL-3.0](LICENSE).
- **Textos e conteúdo editorial:** [CC BY-SA 4.0](LICENSE-CONTEUDO.md).

## Como trabalhamos

Spec → plano → implementação, um subprojeto por vez. Cada mudança entra por PR. Veja o [`CONTRIBUTING.md`](CONTRIBUTING.md).
