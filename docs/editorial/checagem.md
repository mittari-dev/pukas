# Checagem: o compromisso com a verdade

> **O fato ganha da tese.** Se um fato contrariar o que a gente acredita, publicamos o fato. Mentira a favor da nossa causa continua sendo mentira, e quem descobre uma mentira nossa para de confiar em tudo o que a gente diz.

Nenhuma edição vai ao ar sem passar por aqui. O build do site **recusa** a edição sem fonte primária, sem crédito e licença da foto ou sem o registro de checagem (`src/lib/edicoes.ts`).

## 1. O que é fonte primária

É o documento do próprio fato, não alguém contando sobre ele.

| Conta como primária | Onde achar |
|---|---|
| Lei, decreto, medida provisória | [Planalto, Legislação](https://www4.planalto.gov.br/legislacao), Diário Oficial da União |
| Jornal ou revista **da época** | [Hemeroteca Digital, Biblioteca Nacional](https://memoria.bn.gov.br) |
| Documento de acervo (ata, boletim de greve, panfleto, ofício) | [Arquivo Nacional (SIAN)](https://sian.an.gov.br), [Arquivo Edgard Leuenroth, Unicamp](https://www.ifch.unicamp.br/ael), [CPDOC, FGV](https://cpdoc.fgv.br), acervos de sindicatos |
| Dado oficial | IBGE, DIEESE (metodologia publicada), Ministério do Trabalho |
| Depoimento registrado | Entrevista gravada ou transcrita, com nome, data e autorização |

**Secundária** é livro, artigo, reportagem atual ou verbete que *conta* o fato. Ela ajuda a achar a primária e a entender o contexto, mas não basta sozinha.

## 2. Checklist de cada edição

- [ ] **Data:** o ano, o mês e o lugar do fato conferem em pelo menos **duas fontes**, e uma delas é primária.
- [ ] **Número:** todo número da edição e do carrossel está **na fonte primária**, igual. Número arredondado diz que é arredondado ("cerca de").
- [ ] **Causa e efeito:** "X conquistou Y" só aparece se a fonte sustentar a ligação. Se a conquista teve várias causas (greve, negociação, governo, contexto), o texto diz isso.
- [ ] **Citação:** frase entre aspas tem autor, data e fonte. Nunca atribuir frase sem documento.
- [ ] **Foto:** tem crédito e licença que permitem o uso (domínio público, Creative Commons compatível, ou autorização por escrito). A descrição para quem não enxerga está escrita.
- [ ] **Links:** todos abrem. A data de acesso (`acessadaEm`) está preenchida.
- [ ] **Linguagem:** manchete com até 8 palavras e nenhum jargão ("hegemonia", "práxis", "vanguarda"). Passa no teste da fala de bar.
- [ ] **Carrossel = edição:** os números e frases dos slides são os mesmos da edição.
- [ ] **Registro:** `checagem: { por, em }` preenchido por quem conferiu, que não pode ser só quem escreveu.

## 3. Quando o fato contraria a tese

1. Não esconda e não corte. Coloque o fato na edição.
2. Se a edição inteira dependia da tese, troque de pauta ou reescreva o ângulo.
3. Registre no PR o que mudou e por quê.

## 4. Correções

Erro publicado se corrige **em público**, na própria edição:

```yaml
correcoes:
  - em: 2026-11-20
    texto: "A lei é de 1925, não de 1926, como dizia a versão anterior."
```

A página mostra a correção com data. Se o erro estava no carrossel, publique um story ou comentário fixado com a correção e o link da edição.
