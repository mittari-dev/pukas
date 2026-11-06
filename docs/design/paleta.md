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

| Texto / fundo | Medido | Mínimo exigido | Uso |
|---|---|---|---|
| Tinta sobre Cal | **14,86:1** | 7:1 | Corpo de texto (Leitura) |
| Ipê sobre Tinta | **7,92:1** | 4.5:1 | Destaque |
| Cal sobre Pau-Brasil | **6,41:1** | 4.5:1 | Tarja, chamadas (Agitação) |
| Ipê sobre Verde-Mata | **4,96:1** | 4.5:1 | Só no Técnico |
| Ipê sobre Pau-Brasil | **3,42:1** | 3:1 | Só texto ≥ 24px |
| Pau-Brasil sobre Tinta | **2,32:1** | — | **Nunca texto** |

Histórico: v1.1 (Verde-Mata 50% + Ipê 20%, canvas https://claude.ai/artifact/TwricwX9r2pFMqUzyRnZkL) foi substituída pela v2.0 depois do diagnóstico "verde + amarelo = bandeira".
