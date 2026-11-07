# Consultas populares: perguntas para decidir antes da spec

- **Status:** perguntas para o fundador (08/11/2026). Nada foi construído.
- **De onde vem:** o pedido do fundador de "alguma coisa interativa no site, desde já, não gamificada, séria, que contribua de verdade: votos sobre leis, PECs, mudanças, discursos". Também a ideia "Votações auditáveis" do roadmap e as exigências de segurança do ADR-0002.

## O que já está decidido (no ADR-0002 e no roadmap)

- **Segurança:**
  - limite por dispositivo e por IP, guardado como hash;
  - honeypot;
  - verificação anti-bot invisível;
  - link mágico por e-mail nas consultas de alto impacto.
- **Comprovante anônimo** (`#PK-892F`), que o votante confere numa lista pública.
- **Metodologia em cada resultado:** votos registrados, votos descartados e o motivo de cada descarte.
- **A manchete diz "94% de quem votou no PUKAS"**, nunca "94% dos trabalhadores". A base não é amostra da população. Essa regra entra na checagem.
- **LGPD:** coletar o mínimo e publicar a política de privacidade, que vira uma Página nova com endereço próprio.

## Perguntas (com a minha recomendação)

**1. Sobre o que as pessoas votam?**
- **A) Projetos de lei e PECs em tramitação no Congresso (minha recomendação para começar).** Câmara e Senado têm dados abertos oficiais com o texto, o autor, a fase e, depois, como cada parlamentar votou. Tudo tem fonte primária, como o resto do PUKAS.
- B) Também medidas do governo, decretos e decisões do STF.
- C) Também discursos e declarações ("você concorda com o que o ministro disse?"). É mais subjetivo e mais difícil de manter sério; deixaria para depois.

**2. Que pergunta a pessoa responde?**
- **A) "A favor / contra / não sei", mais um campo opcional "como isso afeta a sua vida" (minha recomendação).** Esse campo vira matéria-prima de reportagem, com consentimento explícito para citar sem nome.
- B) Só "a favor / contra".
- C) Uma escala de 1 a 5.

**3. Mostrar como votaram os parlamentares, ao lado do resultado da consulta?**
- **A) Sim, quando a votação nominal sair (minha recomendação).** "68% de quem votou no PUKAS foi contra; na Câmara, 312 deputados votaram a favor", com a lista de quem votou como, por estado e partido, tirada dos dados abertos. É fato, com fonte, e ninguém faz isso de forma simples.
- B) Não; só o resultado da consulta.

**4. Quanto de identificação pedir?**
- **A) Nenhum cadastro nas consultas comuns (minha recomendação).** Usa a verificação anti-bot invisível (Cloudflare Turnstile, que é grátis), um voto por dispositivo e o IP guardado como hash. Nas consultas de alto impacto, um link mágico por e-mail, com o e-mail apagado depois de confirmar. O e-mail grátis do Supabase não serve para isso (ele só manda para quem é da equipe). Precisa de um provedor de e-mail, e o Resend é grátis até 3 mil e-mails por mês, mas exige o domínio `pukas.lat`.
- B) Login por e-mail em todas as consultas: mais seguro, mas menos gente vota.

**5. Quem decide o que vira consulta?**
- **A) A redação, pelo painel (minha recomendação).** Um tipo novo no Estúdio, "Consulta", com a proposição, uma explicação neutra de duas linhas (o que muda, para quem) e as fontes. Ela passa pela mesma revisão de qualquer peça.
- B) O público sugere e a redação aprova: fica para uma segunda versão.

**6. Quanto tempo uma consulta fica aberta?**
- **A) Até a votação no plenário, ou 30 dias, o que vier primeiro (minha recomendação).** Depois, o resultado fica congelado e o comprovante continua conferível.
- B) Sempre aberta.

**7. Onde fica no site?**
- **A) Uma seção `/consultas`, no menu, com a consulta aberta mais recente na capa, na coluna da direita (minha recomendação).**

## O que fica de fora da primeira versão

- Ranking, pontos, medalhas e qualquer coisa de jogo (pedido do fundador).
- Comentários abertos: moderação dá trabalho e atrai ataque.
- "Raio-X de Classe": outro projeto do roadmap.

## Depois das respostas

A spec em `docs/specs/`, o plano e a construção, do mesmo jeito que a Agenda e a Busca. Uma decisão técnica já dá para adiantar: as consultas pedem uma rota do servidor que recebe votos do público. É a primeira parte do site que o público grava, então a revisão de segurança dela precisa ser mais rigorosa que a do resto.
