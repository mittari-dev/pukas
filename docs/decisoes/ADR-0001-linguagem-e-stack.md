# ADR-0001 — Linguagem e stack da plataforma

- **Status:** Aceito (05/11/2026)
- **Data:** 05/11/2026
- **Decisores:** fundador do PUKAS

## Contexto

O PUKAS precisa de uma única base de código que sustente, ao mesmo tempo:

1. **Texto longo de alta qualidade.** Newsletter, teses, ensaios e contos, com tipografia cuidada, notas e citações.
2. **Páginas temáticas.** Cada dossiê tem a sua própria página, com direção de arte própria.
3. **Páginas interativas.** Visualização de dados, WebGL/Three.js, simuladores e perfiladores.
4. **Volume.** Centenas de textos ao longo dos anos, sem degradar build, leitura ou manutenção.

Restrições:

- Um desenvolvedor no começo. Cada linguagem a mais é custo de manutenção.
- Leitura rápida no celular e em conexões ruins, que é o público real.
- Independência de Big Tech, como diz o manifesto: o conteúdo precisa ser portátil e não pode ficar preso a um CMS proprietário.

## Decisão

| Camada | Escolha | Por quê |
|---|---|---|
| **Linguagem** | **TypeScript** (modo `strict`) | É a única linguagem que roda nativamente no navegador, onde vivem as páginas interativas, e também no servidor e no build. Com uma linguagem só, o código serve do texto ao WebGL. Os tipos seguram o volume de conteúdo. |
| **Framework** | **Astro** | Feito para sites de conteúdo. Por padrão a página sai em HTML puro, sem JavaScript, e é isso que deixa a leitura rápida. O JavaScript entra só nas "ilhas" interativas, como gráficos e cenas 3D. |
| **Conteúdo** | **MDX em Git**, validado por *Content Collections* (esquemas Zod) | MDX é Markdown, que é universal e portátil, e ainda aceita componentes. Um dossiê pode trazer um gráfico interativo no meio do ensaio. O esquema barra publicação com metadado faltando. O Git dá histórico e revisão por PR. |
| **Interatividade** | Ilhas em **React** + **Three.js** / **D3** quando for necessário | Têm o maior ecossistema de visualização. Só entram nas páginas que usam. |
| **Estilo** | **CSS puro com tokens** (custom properties) | A paleta e a tipografia viram variáveis. Não há dependência nem build extra, e é padrão da web. |
| **Hospedagem** | Saída **estática**, no Vercel | O site estático é o mais barato, o mais rápido e o mais fácil de migrar. O mesmo build roda no Cloudflare Pages ou num servidor próprio. |
| **Qualidade** | `astro check` (tipos), Vitest (lógica), CI no GitHub Actions | Todo PR passa por checagem de tipos e build. |
| **Pacotes** | npm | Já vem com o Node 24 instalado. Não precisa de ferramenta extra. |

## Alternativas consideradas

- **Next.js.** É mais pesado. Os componentes de servidor ajudam, mas a hidratação e a complexidade não pagam o custo num site de leitura.
- **Hugo (Go).** O build é muito rápido, mas a interatividade continuaria em JavaScript. Seriam duas linguagens e um sistema de templates fraco para páginas temáticas.
- **SvelteKit.** É bom, mas o ecossistema de visualização e 3D é menor que o do React.
- **CMS headless** (Sanity, Contentful). Prende o conteúdo a um terceiro. Fica para depois, se surgir uma equipe editorial que não use Git.

## Consequências

- Escrever exige editar MDX. Para o fundador, que é desenvolvedor, isso basta. Se a redação crescer, avaliamos um CMS que grave em Git, como Decap ou Keystatic, sem migrar o conteúdo.
- Envio de e-mail, comentários e qualquer coisa dinâmica entram como serviços à parte, ou como rotas de servidor do Astro, quando forem necessários.
- O conteúdo em MDX pode ser migrado para qualquer outro sistema.
