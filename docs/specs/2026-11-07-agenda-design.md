# Agenda editorial no painel

- **Status:** aprovado pelo fundador (07/11/2026). Ritmo editável pelo painel; redator cria e edita itens; "Começar a escrever" entra já.
- **Depende de:** painel (spec de 06/11/2026) e Estúdio
- **Fica de fora:** qualquer automação. A agenda organiza; ela não publica, não lembra por e-mail e não sugere pauta. O robô de notícias é outra spec.

## 1. Para que serve

O fundador tem 2 a 3 horas por dia. A agenda mostra o que sai em cada dia, o que está atrasado e onde a semana tem buraco, para não acumular nem deixar dia vazio. Ela precisa caber no celular, onde a maior parte do trabalho acontece.

## 2. O que é um item

Um item é próprio da agenda (decisão do fundador: opção A). Ele não é uma peça. Cada item tem:

| Campo | Obrigatório | Observação |
|---|---|---|
| Dia | sim | Data, sem hora |
| Tipo | sim | Newsletter (com série), Notícia ou Cultura |
| Série | só para Newsletter | A mesma lista `SERIES` do Estúdio |
| Título provisório | sim | Até 120 caracteres |
| Nota | não | Texto livre: "a greve de 1917, achar o jornal da época" |
| Situação | sim | Ideia, escrevendo, em revisão, pronta ou publicada |
| Peça ligada | não | Uma peça do Estúdio |
| Responsável | não | Uma pessoa da equipe |

**Situação:**
- Sem peça ligada, a situação é manual: ideia, escrevendo ou pronta.
- Com peça ligada, a situação acompanha a peça. Rascunho vira escrevendo, em revisão vira em revisão, publicada vira publicada e rejeitada vira ideia. Ninguém precisa atualizar nada à mão. É o único automático da agenda, e ele só lê o estado da peça.

## 3. Ritmo da casa

O ritmo são os compromissos fixos de publicação, por exemplo "Newsletter · Memória Operária, toda segunda". Na agenda ele aparece como um **espaço reservado** (tracejado) no dia em que deveria sair algo. Ele não é um item: é um lembrete, e some quando um item do mesmo tipo (e da mesma série, se for newsletter) ocupa o dia.

O ritmo é **editável pelo painel** (decisão do fundador), em `/painel/agenda/ritmo`. Cada compromisso tem:
- dia da semana (segunda a domingo);
- tipo e série;
- um rótulo opcional;
- ativo ou pausado.

Só o editor mexe no ritmo; a equipe toda vê. A tabela começa com um compromisso: Memória Operária às segundas.

## 4. Telas

**`/painel/agenda`**, uma seção nova na barra do topo: ESTÚDIO · AGENDA · EQUIPE.

- **Celular** (até 900 px): **só semana**. A semana vira uma lista de 7 blocos, um por dia, de segunda a domingo. Cada dia mostra os seus itens e o espaço do ritmo, quando houver. Setas levam à semana anterior e à próxima, e um botão "Hoje" volta à semana atual.
- **Computador:** **semana e mês**, com um seletor "Semana | Mês".
  - A semana vira 7 colunas.
  - O mês vira uma grade de calendário. Cada dia mostra no máximo 3 itens e um "+ N", que leva para a semana daquele dia.
- **Hoje** fica marcado. **Dia passado com item que não saiu** (situação diferente de publicada) fica marcado como atrasado.
- **Item no calendário:** chapéu do tipo, título e situação. Tocar no item abre a edição.
- **Criar:** um "+" em cada dia abre o formulário do item num modal (`<dialog>`, com o mesmo comportamento do "Nova peça").
- **Editar o item:** mudar o dia, o tipo, o título, a nota e a situação; ligar a uma peça (lista das peças que ainda não estão ligadas); apagar.
- **"Começar a escrever":** no item sem peça, abre o editor do Estúdio com o tipo e a série do item, e liga a peça ao item no primeiro "Salvar".
- O endereço guarda a visão e a data (`?visao=semana&dia=2026-11-09`), para as setas do navegador funcionarem.

O visual segue o do Estúdio: fios finos, chapéu vermelho, sem sombra e sem canto arredondado.

## 5. Quem pode o quê

| | editor | revisor | redator |
|---|---|---|---|
| Ver a agenda | sim | sim | sim |
| Criar e editar item | sim | sim | sim |
| Apagar item | sim | sim | só os que criou |
| Editar o ritmo | sim | não | não |

Tudo isso exige 2FA confirmado (aal2), como o resto do painel, e a RLS repete a regra no banco.

## 6. Dados

Uma tabela nova, `agenda`:

- `id`
- `dia` (date)
- `tipo` (tipo_peca, sem 'pagina')
- `serie`
- `titulo`
- `nota`
- `situacao`: um enum (ideia, escrevendo, pronta), usado só quando não há peça
- `peca_id`: referência a `pecas`, única, `on delete set null`
- `responsavel`: referência a `perfis`
- `criado_por`
- `criado_em`

Mais uma tabela, `ritmo`: `id`, `dia_semana` (1 = segunda … 7 = domingo), `tipo`, `serie`, `rotulo`, `ativo`, `criado_em`. Ela começa com uma linha: (1, newsletter, memoria-operaria).

A situação mostrada vem de uma função pura, `situacaoDoItem(item, estadoDaPeca)`. Ela não é gravada em coluna nenhuma, para nunca sair de sincronia com a peça.

## 7. Testes

- **Unitários:**
  - `situacaoDoItem`;
  - a semana e a grade do mês: começo na segunda, virada de mês e de ano, fuso America/Sao_Paulo;
  - o espaço do ritmo some quando um item do mesmo tipo e da mesma série ocupa o dia; um compromisso pausado não aparece;
  - atrasado.
- **Banco (CI):** RLS das tabelas `agenda` e `ritmo`, cobrindo a tabela de papéis e o aal2, e `peca_id` único.
- **Ponta a ponta (CI):** o editor cria um compromisso de ritmo e o espaço aparece no dia certo; criar um item, editar, ligar a uma peça e ver a situação acompanhar a publicação; e o "Começar a escrever" ligando a peça.
- **Visual:** capturas em 360, 390 e 1280 px.

## 8. Decisões do fundador nesta revisão

1. Ritmo editável pelo painel (§3).
2. O redator pode criar e editar item (§5).
3. "Começar a escrever" entra já nesta versão (§4).
