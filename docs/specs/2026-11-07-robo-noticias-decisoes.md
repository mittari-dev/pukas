# Robô de notícias: decisões já tomadas (antes da spec)

Brainstorming interrompido em 07/11/2026: o fundador pôs antes a cara de jornal operário e a agenda editorial. Este arquivo guarda o que já foi decidido, para a spec do robô continuar daqui.

- **Curadoria em duas etapas.** O robô entrega uma **pauta** de cerca de 10 candidatas. Cada uma vem com uma linha dizendo por que importa para a classe trabalhadora e de onde veio. O fundador escolhe 1 ou 2, e só essas viram rascunho completo, em `em_revisao`. O robô nunca publica.
- **Ritmo:** segunda, quarta e sexta, mais o botão "rodar agora" no painel.
- **Custo:** teto de R$ 50 por mês. O custo de cada rodada é medido e mostrado no painel.
- **Controle pelo painel**, na seção BUSCA (`/painel/busca`): ligar e desligar; fontes; temas; limites; teto; rodar agora; histórico das rodadas com o custo de cada uma.
- **Critério:** só entra notícia que pesa sobre a classe trabalhadora ou sobre o socialismo. Inclui notícia do mundo que afeta o Brasil e a América Latina. Sem meta de volume: o que conta é profundidade, com começo, meio e fim.
- **Fontes fixas:**
  - **Brasil:** Agência Brasil, Brasil de Fato, Folha, UOL, g1, Agência Pública, Repórter Brasil, The Intercept Brasil e DIEESE.
  - **América Latina:** Página/12, La Jornada, CIPER e teleSUR.
  - **Mundo**, só o que afeta o Brasil e a América Latina: Reuters e AP.
  - **Documento primário:** Diário Oficial da União, Câmara, Senado e IBGE.
- **Busca livre na web** só quando o próprio agente precisa: as fontes fixas não bastaram, falta contexto, é preciso confirmar um dado ou o caso é maior e pede mais fontes.
- **Fora do escopo:** radar e pistas (etapa 3).
- **Em aberto para a spec:**
  - o formato da pauta no painel;
  - o modelo e a forma da chamada (API com busca na web);
  - como o rascunho cita as fontes lidas;
  - o que acontece quando o teto acaba.
