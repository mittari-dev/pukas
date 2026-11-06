# PUKAS — Paleta (v2.0)

| Nome | HEX | Papel |
|---|---|---|
| Pau-Brasil | `#9E2A1E` | Marca, ruptura |
| Tinta | `#1C1A17` | Texto, retícula (funcional) |
| Cal | `#F1EDE4` | Papel, leitura (funcional) |
| Ipê | `#E0A526` | Destaque, dado |
| Verde-Mata | `#1A452C` | Módulo técnico |

Receitas e regras: [identidade-visual.md §3](identidade-visual.md#3-cor).

## Contraste (verificado por teste em `src/lib/contraste.test.ts`)

| Texto / fundo | Mínimo exigido | Uso |
|---|---|---|
| Tinta sobre Cal | 7:1 | Corpo de texto (Leitura) |
| Cal sobre Pau-Brasil | 4.5:1 | Tarja, chamadas (Agitação) |
| Ipê sobre Tinta | 4.5:1 | Destaque |
| Ipê sobre Verde-Mata | 4.5:1 | Só no Técnico |
| Pau-Brasil sobre Tinta | — | **Nunca texto** (contraste < 3:1) |

Histórico: v1.1 (Verde-Mata 50% + Ipê 20%, canvas https://claude.ai/artifact/TwricwX9r2pFMqUzyRnZkL) foi substituída pela v2.0 depois do diagnóstico "verde + amarelo = bandeira".
