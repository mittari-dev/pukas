# Busca: robô de notícias com curadoria

- **Status:** rascunho para o fundador revisar (07/11/2026).
- **Parte de:** `docs/specs/2026-11-07-robo-noticias-decisoes.md`, onde estão as decisões já tomadas.
- **Fora daqui:** radar e pistas (etapa 3), e portais pagos (JusBrasil).

## 1. Para que serve

Achar, três vezes por semana, as notícias que pesam sobre a classe trabalhadora e o socialismo no Brasil, na América Latina e no mundo, e entregar ao fundador uma **pauta curta e bem justificada**. O robô nunca publica. Ele só escreve o rascunho das notícias que o fundador escolher, e esse rascunho ainda passa pela revisão no Estúdio.

O que conta é a qualidade da escolha, não o volume. Dez candidatas bem justificadas valem mais que cinquenta links.

## 2. O fluxo

1. **Rodada.** Na segunda, na quarta e na sexta, por volta das 7h de Brasília, ou quando alguém aperta **"Rodar agora"**, o robô lê as fontes e monta a **pauta**: até 10 candidatas.
2. **Pauta.** Cada candidata traz:
   - título;
   - **por que importa para quem trabalha**, numa ou duas frases;
   - região (Brasil, América Latina, mundo) e tema;
   - **as fontes lidas**, com veículo, título e link;
   - "o que falta confirmar", quando houver.
3. **Escolha.** No painel, o editor ou o revisor marca 1 ou 2 candidatas e aperta **"Virar rascunho"**. Pode também descartar uma, com o motivo, para o robô aprender o que não interessa.
4. **Rascunho.** O robô relê as fontes e escreve a notícia na linha do PUKAS, com começo, meio e fim. A peça entra no Estúdio como **Notícia em revisão**, marcada como "robô", com as fontes já preenchidas como secundárias e a checagem em branco. A checagem é sempre humana.
5. **Revisão.** Daí em diante é o fluxo normal do Estúdio: editar, checar, pôr a fonte primária quando houver, publicar ou rejeitar.

## 3. Fontes e busca

- **Fontes fixas** (lista inicial; cada uma pode ser ligada e desligada no painel):
  - **Brasil:** Agência Brasil, Brasil de Fato, Folha, UOL, g1, Agência Pública, Repórter Brasil, The Intercept Brasil e DIEESE.
  - **América Latina:** Página/12, La Jornada, CIPER e teleSUR.
  - **Mundo:** Reuters e AP.
  - **Documento primário:** Diário Oficial da União, Câmara, Senado e IBGE.
- **Busca livre na web:** é um interruptor no painel, ligado no começo. Quando está ligado, o robô primeiro varre as fontes fixas. Ele só sai para a web aberta quando falta contexto, quando precisa confirmar um dado ou quando o caso é maior do que as fontes fixas cobrem. Cada fonte usada fica registrada, com a marca "fixa" ou "livre". Quando está desligado, a busca fica presa aos domínios das fontes fixas.
- **Temas:** duas listas editáveis no painel, "interessa" e "não interessa". Os descartes com motivo também voltam para o robô na rodada seguinte.

## 4. O painel: seção BUSCA (`/painel/busca`)

A seção entra na barra do topo: ESTÚDIO · AGENDA · BUSCA · EQUIPE.

- **Pauta:** a última rodada no topo, com as candidatas (ver §2), os botões "Virar rascunho" e "Descartar", e um link para as rodadas anteriores.
- **Rodar agora:** fica desligado enquanto uma rodada está em andamento ou quando o teto do mês já foi atingido.
- **Gasto do mês:** quanto já foi gasto do teto de **R$ 50**, em reais, com a barra e o custo de cada rodada.
- **Configuração** (só editor):
  - ligar e desligar o robô;
  - os dias e o horário;
  - as fontes fixas (interruptor, nome e domínio, com a opção de adicionar uma nova);
  - o interruptor da busca livre;
  - os temas que interessam e os que não interessam;
  - o máximo de candidatas por rodada (padrão 10);
  - o teto mensal em reais e o câmbio usado na conta.
- **Histórico:** cada rodada com a data, quem pediu (agendada ou o nome da pessoa), a situação (rodando, pronta, erro, teto atingido), quantas fontes leu, quantas buscas fez, os tokens e o custo.

## 5. Como roda

- **Um workflow do GitHub Actions** (`busca.yml`) roda a cada 15 minutos, com os segredos que já existem (chave mestra do banco e chave da API). Em cada execução ele faz três coisas, nesta ordem:
  1. começa uma rodada se for dia e hora e a do dia ainda não tiver rodado;
  2. começa uma rodada se alguém tiver apertado "Rodar agora";
  3. escreve os rascunhos pedidos.

  Na maior parte das vezes não há nada a fazer, e ele termina em segundos. "Rodar agora" leva no máximo 15 minutos para começar. O painel mostra "na fila".
- **Modelo:** Claude Sonnet 5.5, com a ferramenta de busca na web e a de leitura de páginas. A busca fica presa aos domínios fixos quando a busca livre está desligada. Quem implementar segue a documentação atual da API, sem supor a forma das ferramentas.
- **Saída estruturada:** a pauta e o rascunho saem em JSON validado, do mesmo jeito que a tradução já faz. Uma resposta fora do formato vira "erro" na rodada, e nada entra pela metade.
- **Linha editorial:** as instruções do robô ficam num arquivo do repositório, `src/lib/busca/instrucoes.ts`, para dar para ler e corrigir. Elas trazem:
  - o critério de seleção;
  - a voz do PUKAS (direta e popular, sem frase de efeito);
  - a regra de que fato com fonte vem antes de opinião;
  - a regra de nunca afirmar crime de pessoa com nome sem decisão judicial.

  O manifesto novo, quando sair, entra nessas instruções.
- **Teto:**
  - **Antes de cada rodada,** o robô soma o gasto do mês. Se faltar menos que o custo médio de uma rodada, ele não roda e registra "teto atingido".
  - **O custo de cada chamada** é calculado pelo uso de tokens e de buscas, com a tabela de preços no código, e convertido em reais pelo câmbio da configuração.
  - **Garantia extra:** o limite mensal no próprio console da Anthropic, que o fundador já configura.

## 6. Dados

- `busca_config`: uma linha só, com ativo, dias, horário, busca_livre, temas_interessa (text[]), temas_evita (text[]), max_candidatas, teto_brl e cambio.
- `busca_fontes`: id, nome, dominio, grupo (brasil, america-latina, mundo, documento) e ativa.
- `busca_rodadas`: id, pedida_por (null quando é agendada), estado (na_fila, rodando, pronta, erro, teto), comecou_em, terminou_em, buscas, tokens_entrada, tokens_saida, custo_brl, erro.
- `busca_candidatas`: id, rodada_id, titulo, porque, regiao, tema, fontes (jsonb: veiculo, titulo, url, fixa), falta_confirmar, estado (nova, pedida, rascunho, descartada), motivo_descarte, peca_id.

**Quem pode:**
- a equipe com 2FA lê tudo;
- o editor e o revisor escolhem e descartam candidatas;
- só o editor mexe na configuração, nas fontes e no "Rodar agora";
- o robô grava com a chave mestra, no GitHub Actions.

## 7. Testes

- **Unitários:**
  - a conta do custo em reais;
  - a regra do teto, que barra quando falta dinheiro para uma rodada;
  - "é hora de rodar?", com os dias, o horário em Brasília e a rodada que já aconteceu no dia;
  - a validação do JSON da pauta e do rascunho, recusando candidata sem fonte;
  - a montagem do pedido à API, com os domínios presos quando a busca livre está desligada.
- **Banco (CI):** a RLS das quatro tabelas.
- **Ponta a ponta (CI):**
  - "Rodar agora" cria a rodada na fila;
  - uma pauta falsa gravada pelo teste aparece no painel;
  - "Virar rascunho" marca a candidata como pedida;
  - o editor que desliga uma fonte vê a mudança na configuração.
  
  A chamada real à API não roda no CI.
- **Rodada real:** uma, com o ok do fundador, para medir o custo e anotar no ledger.

## 8. Decisões pedidas ao fundador nesta revisão

1. Busca livre começa **ligada** (§3)?
2. **Editor e revisor** escolhem as candidatas; só o editor configura e roda (§6)?
3. Horário das rodadas: **7h de Brasília** (§2)?
4. O rascunho do robô entra como **Notícia em revisão**, assinado "PUKAS", com a marca "robô" visível só no painel (§2)?
