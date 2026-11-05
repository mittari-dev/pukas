# Como trabalhamos no PUKAS

## Ciclo de cada subprojeto

1. **Spec** em `docs/specs/AAAA-MM-DD-tema-design.md`: objetivo, escopo, arquitetura e questões em aberto.
2. **Plano** de implementação: tarefas pequenas, cada uma vira uma issue no milestone do subprojeto.
3. **Implementação** por PR, uma issue por PR sempre que possível.

Decisões de arquitetura viram um ADR em `docs/decisoes/`.

## Branches

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feat/` | Funcionalidade | `feat/rss` |
| `fix/` | Correção | `fix/contraste-carimbo` |
| `docs/` | Documentação, spec ou ADR | `docs/spec-dossie` |
| `texto/` | Conteúdo editorial novo | `texto/manifesto-de-trincheira-001` |
| `chore/` | Infraestrutura, dependências, CI | `chore/ci-build` |

A `main` está sempre publicável. Não há commit direto nela.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português e no imperativo:

```
feat(newsletter): adiciona página de arquivo das edições
fix(tokens): corrige contraste do Ipê sobre Pau-Brasil
docs(adr): registra escolha de Astro
```

Escopos comuns: `tokens`, `identidade`, `newsletter`, `dossie`, `rss`, `ci`, `adr`, `spec`.

## Pull requests

- Use o template, que pede o que muda, por quê e como testar.
- Ligue o PR à issue com `Closes #N`.
- O CI precisa passar (tipos e build).
- Texto editorial: revise no *preview* do Vercel antes do merge.

## Labels

| Label | Significado |
|---|---|
| `tipo: feature` · `tipo: bug` · `tipo: docs` · `tipo: chore` | Natureza da mudança |
| `area: design` · `area: conteudo` · `area: plataforma` · `area: dados` | Onde a mudança mexe |
| `prioridade: alta` | Bloqueia o milestone atual |
| `decisao-pendente` | Precisa de decisão do fundador antes de seguir |
