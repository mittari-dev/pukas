# Roadmap

Cada subprojeto segue o ciclo **spec → plano → implementação**, com milestone próprio no GitHub.

## Ritmo editorial

| Quando | O quê | Formato |
|---|---|---|
| **Toda segunda** (desde o lançamento) | Newsletter **Memória Operária**: o que a classe já conquistou, o que está batalhando e para onde vai | Edição completa no site e por e-mail. Na semana, vira um **carrossel** (4 a 6 imagens) **ou** um **vídeo curto** (60 a 90 s, animado em código), terminando com "leia a edição completa no link da bio" |
| **Toda quinta** (a partir do ~mês 3) | **Investigação do presente**: contratos públicos obscuros, lobby corporativo na América Latina, precarização do trabalho com dados | Matéria no site + carrossel ou vídeo |
| **No tempo da criação** | **Cultura**: contos, cenas, poemas, ensaios e narrativas que são desconfortavelmente palatáveis | Publicado no site quando estiver pronto, com um vídeo de leitura ou anúncio em qualquer dia da semana |

**Foco dos meses 1 a 3:** só a Memória Operária às segundas. O tempo restante vai para construir a infraestrutura (`pukas.lat`) e afinar o tom, sem burnout. Só lança com **4 edições prontas** em estoque.

## Subprojetos

| # | Subprojeto | Entrega | Status |
|---|---|---|---|
| 1 | **Site: núcleo** | Edição da newsletter com fontes, `/links`, manifesto, capa, RSS | ✅ no ar em `pukas.vercel.app` |
| 2 | **Seção de cultura** | Rota própria para contos, cenas, poemas e ensaios | ✅ |
| 3 | **Painel `/painel` (Supabase)** | Publicar, corrigir e revisar o espanhol pelo navegador, com senha e 2FA; seção `/noticias` ([spec](specs/2026-11-06-painel-design.md)) | ✅ código · ⏳ no ar |
| 3.1 | **Agenda editorial** | Semana e mês, itens ligados às peças, ritmo da casa editável ([spec](specs/2026-11-07-agenda-design.md)) | ✅ código · ⏳ no ar |
| 3.2 | **Robô de notícias** | Busca nas fontes fixas e na web, lê as matérias e deixa rascunhos na fila do painel; o fundador aprova. Roda dentro da assinatura do Claude, sem custo extra | ⚪ |
| 3.3 | **Radar e pistas** | Acompanhar figuras públicas e guardar pistas privadas (bucket `arquivos`); pista nunca é publicada como acusação | ⚪ |
| 4 | **Newsletter por e-mail** | Inscrição e envio de cada edição pelo Resend | ⚪ |
| 5 | **Gerador do carrossel e do vídeo** | Slides PNG 1080×1350 e vídeo de 60 a 90 s gerados a partir da edição | ⚪ |
| 6 | **Votações auditáveis** | Consulta à base sobre medidas do Congresso, com antibot, metodologia aberta e comprovante de voto | ⚪ |
| 7 | **Raio-X de Classe** | Perfilador socioeconômico com card compartilhável (~mês 3) | ⚪ |
| 8 | **Investigação (quintas)** | Seção de jornalismo investigativo do presente | ⚪ |
| 9 | **Dossiês · Documentários · Loja** | `/dossies`, `/documentarios`, `/loja` | ⚪ |

## Ideias registradas

### Votações auditáveis da classe trabalhadora

O ciclo funciona assim:
1. O Congresso vota uma medida, e o PUKAS abre a consulta em `pukas.lat`.
2. A base vota.
3. O resultado vira dado auditável, e o dado vira manchete, carrossel e pauta de investigação.
4. Um descontentamento grande com um setor aponta onde investigar na quinta.

**Por que importa:** é a temperatura da base medida direto, sem pesquisa encomendada. A pessoa volta para ver o placar, e a conjuntura gera pauta sem fim.

**Segurança:**
- limite por dispositivo e IP (em hash);
- honeypot;
- verificação anti-bot invisível;
- *magic link* nas consultas de alto impacto;
- nota de metodologia em cada resultado (votos registrados, votos filtrados e margem técnica);
- **comprovante anônimo** (`#PK-892F`), que o votante confere numa lista pública.

> **Cuidado de verdade:** a base do PUKAS não é uma amostra representativa da classe trabalhadora brasileira. A manchete precisa dizer "94% de **quem votou no PUKAS**", nunca "94% dos trabalhadores". Essa regra entra na checagem.

### Loja e materiais impressos

Jornais de formação sobre socialismo, revoluções, luta de classes e consciência de classe. A ideia é que quem compra **vire porta-voz**: o material ensina a espalhar, a falar e a apresentar essas ideias. Conecta com os princípios "reproduzível à mão" e "sobrevive à xerox".

### Monitor da cota parlamentar

Cruzar os gastos da cota parlamentar (dados abertos da Câmara e do Senado) com notas fiscais e empresas, e sinalizar o que foge do padrão. O monitor gera pista para o radar, não manchete. A peça só sai com documento público por trás.

### Outros módulos

Dicionário de Trincheira, Observatório de Contratos e Poder, Simulador Macroeconômico.

Specs: [`specs/`](specs/) · Planos: [`planos/`](planos/) · Decisões: [`decisoes/`](decisoes/)
