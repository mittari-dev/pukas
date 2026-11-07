# Consultas populares: desenho

- **Status:** para revisão do fundador (08/11/2026).
- **Base:** as respostas às 7 perguntas de `2026-11-08-consultas-perguntas.md`. Foi opção A em todas.
- **Também segue:** o ADR-0002 (segurança das votações) e a ideia "Votações auditáveis" do roadmap.

## 1. O que é

Uma consulta pergunta à base o que ela acha de um projeto de lei ou de uma PEC que está no Congresso. A pessoa responde "a favor", "contra" ou "não sei". Se quiser, conta como aquilo afeta a vida dela. Em troca, recebe um comprovante anônimo para conferir o próprio voto.

Quando a votação nominal sai no plenário, o resultado da consulta aparece ao lado de como cada parlamentar votou.

Nada de pontos, ranking ou medalha. A manchete diz sempre "X% de quem votou no PUKAS".

## 2. O que entra na primeira versão

- **Proposições:** projetos de lei (PL, PLP) e PECs da **Câmara dos Deputados**, lidos dos dados abertos oficiais (`dadosabertos.camara.leg.br`).
  - O Senado entra numa segunda etapa. A maior parte dos PLs e das PECs começa na Câmara, e a API do Senado tem outro formato, o que dobraria o trabalho agora.
- **Quem cria:** a redação, pelo painel.
  - "Consulta" vira um tipo novo no Estúdio e passa pela mesma revisão de qualquer peça.
  - A revisão confere se a explicação é neutra antes de publicar.
- **Quem vota:** qualquer pessoa, sem cadastro.
  - Vale um voto por aparelho, com verificação anti-robô invisível.
  - **Alto impacto:** a consulta pode ser marcada assim, mas a confirmação por e-mail só passa a funcionar quando o domínio `pukas.lat` existir. O envio precisa de domínio próprio.
  - Até lá, uma consulta marcada como alto impacto não pode ser publicada. O painel avisa o motivo.
- **Prazo:** a consulta fecha no que vier primeiro: a votação no plenário da Câmara ou 30 dias depois de publicada. Fechada, o resultado congela e o comprovante continua conferível.
- **Onde aparece no site:**
  - a seção `/consultas` no menu (em espanhol, `/es/consultas`);
  - a página de cada consulta em `/consultas/<endereço>`;
  - a consulta aberta mais recente, na coluna da capa ao lado de Notícias e Cultura.

## 3. A página da consulta

De cima para baixo:

1. **A proposição.** Sigla, número e ano, como "PL 1234/2026". Também a ementa oficial e o link para a página na Câmara.
2. **A explicação da redação.** No máximo 300 caracteres, neutros: o que muda e para quem.
3. **As fontes.** Os mesmos campos das outras peças.
4. **O voto.** Três botões grandes ("A favor", "Contra", "Não sei") e o campo opcional "Como isso afeta a sua vida?", com até 1.000 caracteres. Abaixo do campo, uma caixa de marcar, desmarcada: "O PUKAS pode citar o que escrevi, sem o meu nome".
5. **Depois de votar.**
   - O comprovante aparece em letra grande, por exemplo `#PK-892F`, com o botão "Copiar".
   - A parcial também aparece nessa hora.
   - Antes de votar, a pessoa vê só quantos já votaram. Assim a parcial não puxa o voto.
6. **Resultado e metodologia.** São três números: votos registrados, votos descartados e o motivo de cada descarte. A frase é fixa: "Resultado de quem votou no PUKAS. Não é pesquisa com amostra da população."
7. **O plenário**, quando houver votação nominal.
   - Primeiro o placar da Câmara (sim, não, abstenção).
   - Depois a lista de deputados, com filtros por estado e por partido.
   - A lista vem dos dados abertos e cita a fonte.
8. **Lista pública de comprovantes.** Mostra cada comprovante com a opção e o dia, e serve para qualquer um conferir. O relato nunca aparece aí.

## 4. Segurança do voto

É a primeira parte do site em que o público grava no banco. A revisão de segurança dela é mais rigorosa que a do resto.

- **Rota de voto:** o voto entra só por `/api/votar`, no servidor. O público não grava direto no banco.
  - A rota confere o anti-robô (Cloudflare Turnstile, grátis) e o honeypot, um campo escondido que só robô preenche.
  - Só então ela grava, com a chave de serviço. Nenhuma política do banco deixa o público inserir voto.
- **Um voto por aparelho:** o aparelho recebe um identificador aleatório, guardado num cookie e também no armazenamento do navegador.
  - O banco guarda só o hash desse identificador, com um segredo do servidor.
  - O mesmo aparelho na mesma consulta é recusado ("Você já votou nesta consulta"), e a página mostra o comprovante de novo.
- **IP:** é guardado só como hash, com o mesmo segredo.
  - O IP nunca bloqueia ninguém. Em escola, ocupação ou rede de celular, muita gente sai pelo mesmo IP.
  - O que ele faz é marcar: passou de 30 votos do mesmo IP na mesma consulta em uma hora, os seguintes entram como "descartado: muitos votos da mesma rede" e aparecem na metodologia.
- **Voto descartado:** nunca é apagado. Fica guardado com o motivo, e a metodologia conta todos.
- **Relatos:** só editor e revisor leem, no painel. Só os relatos com a autorização marcada podem ser citados. Quem pedir para apagar o seu relato informa o comprovante, e o editor apaga pelo painel.
- **LGPD:** uma página `/privacidade` explica o que é guardado (hash, opção, relato) e o que não é (nome, e-mail, IP aberto).

## 5. Dados (Supabase)

- **`pecas`:** ganha o tipo `consulta`.
  - Ganha também um campo `proposicao` com a casa, a sigla, o número, o ano, o id oficial na Câmara, a ementa e o link.
  - Mais o `fecha_em` e a marca de alto impacto.
  - O que já existe é reaproveitado como está: Estúdio, revisão, tradução, cache e histórico.
- **`votos`:** cada linha tem:
  - a consulta;
  - a opção (`a_favor`, `contra` ou `nao_sei`);
  - o relato e a autorização de citar;
  - o comprovante, que é único;
  - os hashes do aparelho e do IP;
  - a data;
  - se foi descartado, e o motivo.

  As regras de acesso:
  - ninguém de fora lê;
  - editor e revisor leem pelo painel;
  - só a rota do servidor grava.
- **Visões públicas:**
  - a contagem por opção, que só conta os votos válidos;
  - a lista de comprovantes, com comprovante, opção e dia, sem relato e sem hash.
- **`votacoes_plenario`:** guarda o placar e o voto de cada deputado, com nome, partido, estado e voto. Também guarda a data e o id da votação na Câmara.

## 6. O robô do plenário

É um script no GitHub Actions, que roda uma vez por dia, como o backup.

- Para cada consulta aberta, ele pergunta à API da Câmara se houve votação nominal da proposição no plenário.
- Se houve, ele grava o placar e os votos, fecha a consulta e renova o cache da página dela.
- Fecha também as consultas que passaram de 30 dias.
- Não usa IA e não custa nada.

## 7. Painel

- **No Estúdio, "Consulta" entra no modal de criar.** No formulário, a pessoa digita sigla, número e ano.
  - O painel busca na Câmara e preenche a ementa, o link e o id.
  - Se a proposição não existir, o painel avisa e não salva.
- **Na página de uma consulta publicada:**
  - os números de votos e de descartes;
  - os relatos, com filtro "só os que autorizam citar";
  - o botão "apagar relato pelo comprovante".

## 8. Custo

R$ 0:
- o Turnstile é grátis;
- a API da Câmara é aberta;
- o robô do plenário roda no GitHub Actions;
- o banco e o site continuam no plano grátis do Supabase e da Vercel.

O e-mail das consultas de alto impacto (Resend, grátis até 3 mil por mês) só entra depois do domínio.

## 9. O que o fundador faz

- Criar a conta grátis no Cloudflare Turnstile e colar a chave do site e a chave secreta na Vercel.
- Colar na Vercel um segredo novo (`VOTO_SEGREDO`) para os hashes. Eu passo o comando que gera esse segredo no seu computador, para ele não passar pelo chat.

## 10. Fora da primeira versão

- O Senado e as medidas do governo.
- A confirmação por e-mail, que espera o domínio.
- O público sugerir consultas.
- Comentários abertos.
- Qualquer coisa de jogo.
- O endereço curto e o carrossel automático do resultado. A redação faz o carrossel à mão, com os números da metodologia.

## 11. Como sabemos que funciona

- **Testes de banco:**
  - o público não lê voto nem grava direto;
  - a contagem ignora os descartados;
  - o comprovante não se repete;
  - consulta fechada recusa voto.
- **Testes da rota:**
  - sem anti-robô, recusa;
  - honeypot preenchido, recusa;
  - o mesmo aparelho votando duas vezes recebe o mesmo comprovante;
  - o 31º voto da mesma rede na mesma hora entra como descartado.
- **Teste do robô do plenário:** com uma resposta gravada da API da Câmara, ele preenche o placar e fecha a consulta.
- **Revisão de segurança por um agente novo antes do deploy,** com o seu ok.
