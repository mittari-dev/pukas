# Votações populares: desenho

- **Status:** aprovada pelo fundador em 08/11/2026, com as mudanças desta versão.
- **Base:** as respostas às 7 perguntas de `2026-11-08-consultas-perguntas.md` (opção A em todas).
  - O texto de origem do fundador é o "instituto autônomo de sondagem da classe trabalhadora": consulta, dado, matéria, pista de investigação.
  - Também segue o ADR-0002 (segurança das votações) e a ideia "Votações auditáveis" do roadmap.
- **Nome no site:** Votações, em `/votacoes` (em espanhol, Votaciones, em `/es/votacoes`).

## 1. O que é

Uma votação pergunta à base o que ela acha de um projeto de lei ou de uma PEC que está no Congresso. A pessoa responde "a favor", "contra" ou "não sei". Se quiser, conta como aquilo afeta a vida dela. Em troca, recebe um comprovante anônimo, que ela confere numa lista pública.

Quando a votação nominal sai no plenário, o resultado do PUKAS aparece ao lado de como cada parlamentar votou.

O dado alimenta a redação. Um botão no painel transforma o resultado em rascunho de notícia, e os relatos agrupados mostram onde está o descontentamento, que vira pauta de investigação.

Nada de pontos, ranking ou medalha.

**A manchete diz sempre "X% de quem votou no PUKAS".** Nunca "dos trabalhadores": quem votou não é amostra da população, e não sabemos se é trabalhador. Pelo mesmo motivo, o site não publica "margem de erro", que só existe em pesquisa com amostra sorteada.

## 2. O que entra na primeira versão

- **Proposições:** projetos de lei (PL, PLP) e PECs da **Câmara e do Senado**. Os dados vêm das APIs abertas oficiais:
  - `dadosabertos.camara.leg.br`;
  - `legis.senado.leg.br/dadosabertos`.
- **Quem cria:** a redação, pelo painel. "Votação" vira um tipo novo no Estúdio e passa pela mesma revisão de qualquer peça. A revisão confere se a explicação é neutra.
- **Ligação com notícias:** ao criar a votação, a redação escolhe uma ou mais notícias.
  - A votação mostra "Leia a notícia".
  - A notícia mostra a chamada para votar.
- **Quem vota:** qualquer pessoa, sem cadastro. Vale um voto por aparelho, com anti-robô invisível (Cloudflare Turnstile).
- **Alto impacto:** a redação pode marcar uma votação assim. Nesse caso, para votar é preciso entrar com a conta Google.
  - O banco guarda só um hash da conta, nunca o e-mail.
  - Depois do voto, a conta temporária é apagada do Supabase.
  - O link mágico por e-mail entra quando existir o domínio `pukas.lat`.
- **Prazo:** a votação fecha no que vier primeiro, a primeira votação nominal no plenário da casa ou 30 dias depois de publicada. Fechada, o resultado congela e o comprovante continua conferível.
- **No site:**
  - **menu:** item "Votações". A página `/votacoes` mostra as abertas em cima e as encerradas embaixo, com o resultado;
  - **endereço:** cada votação tem a sua página em `/votacoes/<endereço>`;
  - **capa:** a votação aberta mais recente aparece na coluna, acima de Notícias.

## 3. A página da votação

1. **A proposição.** Casa, sigla, número e ano (por exemplo, "PEC 45/2026, Câmara"), a ementa oficial e o link para a página oficial.
2. **A explicação da redação.** No máximo 300 caracteres, neutros: o que muda e para quem.
3. **As fontes e as notícias ligadas**, com "Leia a notícia".
4. **O voto.**
   - Três botões grandes: "A favor", "Contra" e "Não sei".
   - O campo opcional "Como isso afeta a sua vida?", com até 1.000 caracteres.
   - A caixa de marcar "O PUKAS pode citar o que escrevi, sem o meu nome". Ela vem desmarcada.
5. **Depois de votar.**
   - O comprovante aparece em letra grande, por exemplo `#PK-7K3QX9`, com o botão "Copiar". A parcial aparece nessa hora.
   - Antes de votar, a pessoa vê só quantos já votaram, para a parcial não puxar o voto.
   - Quem volta à página no mesmo aparelho vê o próprio comprovante e a parcial.
6. **Resultado e metodologia.**
   - Votos registrados, votos descartados e o motivo de cada descarte.
   - A frase fixa: "Resultado de quem votou no PUKAS. Não é pesquisa com amostra da população."
7. **O plenário**, quando houver votação nominal.
   - O placar da casa (sim, não, abstenção, outros) e a lista de parlamentares, com filtro por estado e por partido.
   - A fonte é citada.
   - A última votação nominal aparece aberta, e as outras ficam recolhidas.
8. **Lista pública de comprovantes válidos**, com o comprovante, a opção e o dia. O relato nunca aparece nela.

## 4. Segurança do voto

É a primeira parte do site em que o público grava no banco. A revisão de segurança dela é mais rigorosa que a do resto e é feita por um agente novo antes do deploy, com o ok do fundador.

- **Rota de voto:** o voto entra só por `/api/votar`, no servidor. Nenhuma política do banco deixa o público gravar ou ler voto.
- **Anti-robô:** a rota confere o Turnstile com a Cloudflare. Sem atestado válido, o voto é recusado com aviso.
  - O script da Cloudflare fica só na página da votação.
  - A política de privacidade avisa que a Cloudflare vê o IP de quem vota.
- **Campo escondido (honeypot):** quando ele vem preenchido, o voto é descartado **em silêncio**.
  - A pessoa, ou o robô, recebe a resposta normal.
  - O voto fica guardado como "descartado: campo escondido preenchido" e entra na metodologia.
- **Um voto por aparelho:** o aparelho recebe um identificador aleatório num cookie `httpOnly`, de um ano.
  - O banco guarda só o hash HMAC dele, com o segredo `VOTO_SEGREDO`.
  - O mesmo aparelho na mesma votação recebe de volta o comprovante que já tinha.
- **IP:** guardado só como hash HMAC. O IP nunca bloqueia ninguém, porque escola, ocupação, sindicato e rede de celular saem pelo mesmo IP.
  - A partir do 31º voto válido da mesma rede na mesma votação em uma hora, os seguintes entram como "descartado: muitos votos da mesma rede".
- **Voto descartado:** nunca é apagado.
- **Relatos:** só editor e revisor leem, no painel, agrupados por opção. Só os relatos com autorização podem ser citados.
  - Quem pedir para apagar o seu relato informa o comprovante, e o editor apaga pelo painel.
- **LGPD:** a página `/privacidade` explica o que é guardado (hashes, opção, relato) e o que não é (nome, e-mail, IP aberto).

## 5. Dados (Supabase)

- **`pecas`:** ganha o tipo `votacao`, e com ele:
  - `proposicao` (jsonb com casa, sigla, número, ano, id oficial, ementa e link);
  - `fecha_em`;
  - `alto_impacto`.

  O que já existe é reaproveitado: Estúdio, revisão, tradução e histórico. Para publicar, vale a trava: proposição preenchida, explicação (o resumo) com até 300 caracteres, pelo menos uma fonte, checagem e manchete curta.
- **`votacao_noticias`:** a ligação entre uma votação e as notícias.
- **`votos`:** cada voto tem:
  - a votação e a opção (`a_favor`, `contra` ou `nao_sei`);
  - o relato e a autorização de citar;
  - o comprovante, que é único;
  - o hash do aparelho, o hash do IP e o hash da conta (no alto impacto);
  - a data;
  - se foi descartado, e o motivo.

  O banco recusa voto em votação fechada ou que não esteja publicada.
- **Funções públicas:** o resultado (contagem só dos válidos, mais os descartes por motivo) e a lista de comprovantes válidos.
- **`plenario_votacoes` e `plenario_votos`:**
  - o placar e o voto de cada parlamentar (nome, partido, UF, voto);
  - a data e o id oficial da votação.

## 6. O robô do plenário

Um script no GitHub Actions, que roda uma vez por dia, sem IA e sem custo.

- Para cada votação aberta, ele pergunta à casa da proposição se houve votação nominal no plenário depois da publicação.
- Se houve, ele grava o placar e os votos e fecha a votação.
- Fecha também as votações que passaram de 30 dias.
- As votações nominais que vierem depois do fechamento também são gravadas, para mostrar.

## 7. Painel

- **Criar:** o Estúdio ganha "Votação" no modal de criar.
  - No formulário, a redação escolhe a casa e digita sigla, número e ano. "Buscar" preenche a ementa, o link e o id oficial. Se a proposição não existir, o painel avisa.
  - A redação escolhe as notícias ligadas e marca "alto impacto".
- **Na votação publicada:**
  - votos válidos e descartes;
  - relatos agrupados por opção, com o filtro "só os que autorizam citar";
  - o botão "apagar relato pelo comprovante";
  - o botão **"Virar rascunho de notícia"**: cria uma notícia em rascunho com os números, a metodologia, o placar do plenário (quando houver) e as fontes, já ligada à votação.

## 8. Custo

R$ 0:
- Turnstile e login Google são grátis;
- as APIs da Câmara e do Senado são abertas;
- o robô roda no GitHub Actions;
- o banco e o site seguem nos planos grátis.

## 9. O que o fundador faz

- Criar o Turnstile na Cloudflare e colar na Vercel a chave do site (`PUBLIC_TURNSTILE_SITE_KEY`) e a secreta (`TURNSTILE_SECRET`).
- Gerar no próprio computador o segredo `VOTO_SEGREDO` e colar na Vercel. O comando vai no plano, e o segredo não passa pelo chat.
- Para o alto impacto:
  - criar o cliente OAuth no Google Cloud;
  - ligar o provedor Google no Supabase, com a URL de retorno do site;
  - permitir cadastro novo no Supabase só pelo Google, mantendo desligado o cadastro por e-mail e senha.
- Revisar e publicar a página `/privacidade`. O texto vai pronto como rascunho no Estúdio.

## 10. Fora da primeira versão

- O link mágico por e-mail, que espera o domínio.
- Medidas do governo e decisões do STF.
- O público sugerir votações.
- Comentários abertos.
- Qualquer coisa de jogo.
- Endereço curto e carrossel automático do resultado.

## 11. Como sabemos que funciona

- **Testes de banco:**
  - o público não lê voto nem grava direto;
  - a contagem ignora os descartados;
  - o comprovante não se repete;
  - votação fechada recusa voto;
  - a trava de publicação da votação.
- **Testes da rota:**
  - sem anti-robô, recusa;
  - honeypot preenchido devolve resposta normal e grava como descartado;
  - o mesmo aparelho votando duas vezes recebe o mesmo comprovante;
  - o 31º voto válido da mesma rede na mesma hora entra como descartado.
- **Testes do robô e da busca da proposição:** com respostas reais gravadas das APIs da Câmara e do Senado.
- **Revisão de segurança** por um agente novo antes do deploy, com o ok do fundador.
