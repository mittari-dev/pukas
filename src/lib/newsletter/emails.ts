// Textos e montagem dos e-mails da newsletter (confirmação, boas-vindas e edição). Os textos em português foram aprovados pelo fundador em 08/11/2026.
import type { Idioma } from '../idioma';

export interface Email {
  assunto: string;
  html: string;
  text: string;
}

interface Texto {
  assunto: string;
  paragrafos: string[];
}

export function emailValido(bruto: string): string | null {
  const e = bruto.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

export const BOAS_VINDAS: Record<Idioma, Texto[]> = {
  pt: [
    {
      assunto: 'Pronto, você assinou o PUKAS',
      paragrafos: [
        'Oi. Aqui é o PUKAS.',
        'A gente conta a história de quem trabalha: de onde vieram as férias, o 13º, a jornada de 8 horas, e o que está em jogo agora. Sempre com a fonte à vista.',
        'O que vai chegar aqui: a Memória Operária, com uma história de luta da classe trabalhadora por edição. A ideia é uma por semana. Quando tiver notícia que pesa no seu bolso ou no seu trabalho, ela também vem.',
        'Nos próximos dias chegam mais dois e-mails curtos: como a gente trabalha e como você pode participar.',
      ],
    },
    {
      assunto: 'Como o PUKAS trabalha',
      paragrafos: [
        'Toda informação que a gente publica tem fonte, e o link fica no texto pra você conferir.',
        'Se a gente erra, corrige na própria matéria, com a data da correção. Se um fato bate de frente com o que a gente pensa, fica o fato.',
        'E ninguém ganha passe livre: governo que se diz do lado de quem trabalha é cobrado pelo que faz, igual a qualquer outro. As derrotas também entram na história.',
        'O manifesto inteiro está em pukas.lat/manifesto.',
      ],
    },
    {
      assunto: 'O PUKAS só anda se você passar adiante',
      paragrafos: [
        'A gente não pede voto e não vende curso. O que faz o PUKAS chegar em mais gente é você: encaminha este e-mail, manda a edição no grupo da família, tira print.',
        'No site também tem as Votações: quando uma proposta importante está no Congresso, você diz se é a favor ou contra e conta como ela mexe na sua vida.',
        'E se você tem uma história de luta no seu trabalho, na sua cidade ou na sua família, responde este e-mail. A gente lê tudo.',
      ],
    },
  ],
  es: [
    {
      assunto: 'Listo, te suscribiste a PUKAS',
      paragrafos: [
        'Hola. Aquí PUKAS.',
        'Contamos la historia de quienes trabajan: de dónde vinieron las vacaciones, el aguinaldo, la jornada de 8 horas, y qué está en juego ahora. Siempre con la fuente a la vista.',
        'Lo que va a llegar aquí: Memoria Obrera, con una historia de lucha de la clase trabajadora por edición. La idea es una por semana. Cuando haya una noticia que pese en tu bolsillo o en tu trabajo, también llega.',
        'En los próximos días llegan dos correos cortos más: cómo trabajamos y cómo puedes participar.',
      ],
    },
    {
      assunto: 'Cómo trabaja PUKAS',
      paragrafos: [
        'Toda información que publicamos tiene fuente, y el enlace queda en el texto para que lo verifiques.',
        'Si nos equivocamos, corregimos en la propia nota, con la fecha de la corrección. Si un hecho choca con lo que pensamos, se queda el hecho.',
        'Y nadie tiene pase libre: un gobierno que dice estar del lado de quien trabaja recibe el mismo reclamo por lo que hace que cualquier otro. Las derrotas también entran en la historia.',
        'El manifiesto completo está en pukas.lat/es/manifesto.',
      ],
    },
    {
      assunto: 'PUKAS solo avanza si lo pasas',
      paragrafos: [
        'No pedimos votos y no vendemos cursos. Lo que hace que PUKAS llegue a más gente eres tú: reenvía este correo, manda la edición al grupo de la familia, sácale una captura.',
        'En el sitio también están las Votaciones: cuando una propuesta importante está en el Congreso de Brasil, dices si estás a favor o en contra y cuentas cómo te afecta.',
        'Y si tienes una historia de lucha en tu trabajo, en tu ciudad o en tu familia, responde este correo. Lo leemos todo.',
      ],
    },
  ],
};

// Dias depois da confirmação em que sai cada e-mail de boas-vindas. O primeiro sai na hora.
const DIAS = [0, 2, 5];

// passosFeitos = quantos e-mails de boas-vindas já saíram. null: a sequência acabou.
export function proximoEm(passosFeitos: number, confirmadoEm: Date): Date | null {
  const dias = DIAS[passosFeitos];
  return dias === undefined ? null : new Date(confirmadoEm.getTime() + dias * 86_400_000);
}

const RODAPE: Record<Idioma, { texto: string; sair: string }> = {
  pt: { texto: 'VOCÊ RECEBE ISTO PORQUE ASSINOU EM PUKAS.LAT', sair: 'SAIR DA LISTA' },
  es: { texto: 'RECIBES ESTO PORQUE TE SUSCRIBISTE EN PUKAS.LAT', sair: 'SALIR DE LA LISTA' },
};
const EXPEDIENTE = 'PUKAS · ÓRGÃO DE MÍDIA &amp; INTELIGÊNCIA LATINO-AMERICANA · PUKAS.LAT';

// Cores da identidade v2.0 (src/styles/tokens.css). E-mail não lê variável de CSS: vão escritas aqui.
const CAL = '#F1EDE4';
const TINTA = '#1C1A17';
const PAU_BRASIL = '#9E2A1E';
const IPE = '#E0A526';
const SUAVE = '#5E584E';
// Quem não tem as fontes do site vê as do sistema: Arial Narrow no lugar da Archivo condensada, Courier no da Space Mono.
const F_MANCHETE = "'Archivo Narrow','Arial Narrow',Arial,Helvetica,sans-serif";
const F_TEXTO = 'Arial,Helvetica,sans-serif';
const F_MAQUINA = "'Space Mono','Courier New',Courier,monospace";

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const linha = (conteudo: string, estilo = '') => `<tr><td style="${estilo}">${conteudo}</td></tr>`;
const titulo = (texto: string) => linha(`<h1 style="margin:0;font-family:${F_MANCHETE};font-weight:900;font-size:44px;line-height:0.95;text-transform:uppercase;color:${TINTA}">${texto}</h1>`, 'padding:32px 0 0');
const paragrafo = (texto: string, extra = '') => `<p style="margin:0 0 16px;font-family:${F_TEXTO};font-size:17px;line-height:1.55;color:${TINTA};${extra}">${texto}</p>`;
const paragrafos = (lista: string[]) => linha(lista.map((t) => paragrafo(escapar(t))).join(''), 'padding:20px 0 0');
const botao = (texto: string, link: string, cor = TINTA) =>
  linha(`<a href="${escapar(link)}" style="display:inline-block;background:${cor};color:${CAL};font-family:${F_MAQUINA};font-weight:700;font-size:14px;letter-spacing:1.5px;text-decoration:none;padding:16px 24px">${escapar(texto)}</a>`, 'padding:12px 0 8px');

// Esqueleto: papel Cal, coluna de 600px, tarja PUKAS com o rótulo à direita, conteúdo, rodapé com expediente ou sair.
function montar(idioma: Idioma, o: { assunto: string; rotulo: string; linhas: string; sair: string | null; rodape?: string }): Email {
  const r = RODAPE[idioma];
  const rodape = o.sair ? `${r.texto} · <a href="${escapar(o.sair)}" style="color:${TINTA}">${r.sair}</a>` : (o.rodape ?? EXPEDIENTE);
  const html = `<!doctype html><html lang="${idioma === 'es' ? 'es' : 'pt-BR'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapar(o.assunto)}</title></head>
<body style="margin:0;padding:0;background:${CAL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CAL}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="border-bottom:3px solid ${TINTA};padding:0 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><span style="display:inline-block;background:${PAU_BRASIL};color:${CAL};font-family:${F_MANCHETE};font-weight:900;font-size:28px;letter-spacing:1px;padding:2px 12px;line-height:1.2">PUKAS</span></td>
<td align="right" style="font-family:${F_MAQUINA};font-size:11px;letter-spacing:1.5px;color:${TINTA}">${escapar(o.rotulo)}</td>
</tr></table></td></tr>
${o.linhas}
<tr><td style="padding:32px 0 0"><p style="margin:0;padding-top:14px;border-top:1px solid ${TINTA};font-family:${F_MAQUINA};font-size:11px;letter-spacing:0.5px;line-height:1.6;color:${TINTA}">${rodape}</p></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${semTags(o.linhas.replace(/<\/(p|h\d|li|tr)>/g, '\n\n').replace(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)'))
    .replace(/\n{3,}/g, '\n\n')
    .trim()}${o.sair ? `\n\n${r.texto}. ${r.sair}: ${o.sair}` : ''}`;
  return { assunto: o.assunto, html, text };
}

export function montarBoasVindas(idioma: Idioma, passo: number, site: string, sair: string): Email {
  const t = BOAS_VINDAS[idioma][passo];
  const rotulo = idioma === 'es' ? `BIENVENIDA · ${passo + 1} DE 3` : `BOAS-VINDAS · ${passo + 1} DE 3`;
  const ir = idioma === 'es' ? 'IR A PUKAS' : 'IR PARA O PUKAS';
  return montar(idioma, { assunto: t.assunto, rotulo, linhas: titulo(escapar(t.assunto)) + paragrafos(t.paragrafos) + botao(ir, idioma === 'es' ? `${site}/es` : site), sair });
}

export function emailConfirmacao(idioma: Idioma, link: string): Email {
  const es = idioma === 'es';
  const linhas =
    titulo(es ? 'Falta un clic.' : 'Falta um clique.') +
    paragrafos([es ? 'Alguien (seguramente tú) pidió recibir PUKAS en este correo. Para confirmar, haz clic en el botón.' : 'Alguém (provavelmente você) pediu pra receber o PUKAS neste e-mail. Pra confirmar, clique no botão.']) +
    botao(es ? 'CONFIRMAR SUSCRIPCIÓN' : 'CONFIRMAR ASSINATURA', link) +
    linha(paragrafo(escapar(es ? 'Si no fuiste tú, ignora este correo: sin la confirmación, no te mandamos nada más.' : 'Se não foi você, é só ignorar este e-mail: sem a confirmação, a gente não manda mais nada.'), 'font-size:16px'), 'padding:16px 0 0');
  return montar(idioma, { assunto: es ? 'Confirma tu suscripción a PUKAS' : 'Confirme sua assinatura do PUKAS', rotulo: 'NEWSLETTER', linhas, sair: null });
}

// O corpo vem do Markdown (micromark) sem estilo: cliente de e-mail ignora CSS de fora, então cada tag ganha o seu.
function estilizarCorpo(html: string): string {
  return html
    .replace(/<p>/g, `<p style="margin:0 0 18px;font-family:${F_TEXTO};font-size:17px;line-height:1.6;color:${TINTA}">`)
    .replace(/<h2>/g, `<h2 style="margin:28px 0 12px;padding-top:12px;border-top:4px solid ${PAU_BRASIL};font-family:${F_MANCHETE};font-weight:900;font-size:26px;line-height:1;text-transform:uppercase;color:${TINTA}">`)
    .replace(/<h3>/g, `<h3 style="margin:24px 0 10px;font-family:${F_MANCHETE};font-weight:900;font-size:21px;line-height:1.1;text-transform:uppercase;color:${TINTA}">`)
    .replace(/<(ul|ol)>/g, `<$1 style="margin:0 0 18px;padding-left:22px;font-family:${F_TEXTO};font-size:17px;line-height:1.6;color:${TINTA}">`)
    .replace(/<blockquote>/g, `<blockquote style="margin:0 0 18px;padding-left:14px;border-left:4px solid ${PAU_BRASIL};font-weight:700">`)
    .replace(/<a href=/g, `<a style="color:${PAU_BRASIL}" href=`)
    .replace(/<img /g, `<img style="display:block;max-width:100%;height:auto;margin:0 0 18px" `);
}

export function emailEdicao(
  idioma: Idioma,
  e: { titulo: string; resumo: string; corpoHtml: string; link: string; serie?: string; numero?: number; data?: string; foto?: { url: string; descricao: string; credito?: string } },
  sair: string,
): Email {
  const es = idioma === 'es';
  const numero = e.numero ? `Nº ${String(e.numero).padStart(3, '0')}` : '';
  const carimbo = numero
    ? linha(`<span style="font-family:'Anton',Impact,${F_MANCHETE};font-size:36px;line-height:1;color:${PAU_BRASIL}">${numero}</span>${e.data ? `<span style="padding-left:14px;font-family:${F_MAQUINA};font-size:12px;letter-spacing:1px;color:${SUAVE}">${escapar(e.data)}</span>` : ''}`, 'padding:28px 0 0')
    : '';
  const foto = e.foto
    ? linha(`<img src="${escapar(e.foto.url)}" alt="${escapar(e.foto.descricao)}" width="600" style="display:block;width:100%;max-width:600px;height:auto"><p style="margin:8px 0 0;font-family:${F_MAQUINA};font-size:10px;letter-spacing:0.5px;color:${SUAVE}">${escapar(e.foto.descricao)}${e.foto.credito ? ` · ${escapar(e.foto.credito)}` : ''}</p>`, 'padding:24px 0 0')
    : '';
  const passe = linha(
    `<p style="margin:0;font-family:${F_MAQUINA};font-size:11px;letter-spacing:1.5px;color:${IPE}">${es ? 'PÁSALO' : 'PASSE ADIANTE'}</p><p style="margin:8px 0 0;font-family:${F_TEXTO};font-size:17px;line-height:1.5;color:${CAL}">${es ? '¿Te gustó? Reenvía este correo o manda el enlace al grupo. La información quieta no cambia nada.' : 'Gostou? Encaminhe este e-mail ou mande o link no grupo. Informação parada não muda nada.'}</p>`,
    `background:${TINTA};padding:20px 24px`,
  );
  const linhas =
    carimbo +
    linha(`<h1 style="margin:0;font-family:${F_MANCHETE};font-weight:900;font-size:44px;line-height:0.95;text-transform:uppercase;color:${TINTA}">${escapar(e.titulo)}</h1>`, numero ? 'padding:16px 0 0' : 'padding:32px 0 0') +
    linha(paragrafo(`<strong>${escapar(e.resumo)}</strong>`, 'font-size:20px;line-height:1.45;margin:0'), 'padding:18px 0 0') +
    foto +
    linha(estilizarCorpo(e.corpoHtml), 'padding:24px 0 0') +
    botao(es ? 'LEER EN EL SITIO, CON LAS FUENTES' : 'LER NO SITE, COM AS FONTES', e.link) +
    `<tr><td style="padding:24px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${passe}</table></td></tr>`;
  return montar(idioma, { assunto: e.titulo, rotulo: (e.serie ?? 'NEWSLETTER').toUpperCase(), linhas, sair });
}

// E-mails da equipe, mandados pelo Supabase (convite e troca de senha). O Supabase troca {{ .ConfirmationURL }}
// pelo link de verdade; o HTML gerado aqui vai para supabase/templates/ e é colado no painel do Supabase.
const LINK_SUPABASE = '{{ .ConfirmationURL }}';
const RODAPE_PAINEL = 'PUKAS · E-MAIL AUTOMÁTICO DO PAINEL · NÃO RESPONDA';

export function emailConvite(): Email {
  const linhas =
    titulo('Você foi chamado pra equipe do PUKAS.') +
    paragrafos(['Clique no botão pra criar a sua senha e entrar no painel. Na primeira entrada, o painel pede pra ligar a verificação em duas etapas no celular.']) +
    botao('ACEITAR O CONVITE', LINK_SUPABASE, PAU_BRASIL) +
    linha(paragrafo('O link vale por 24 horas e só funciona uma vez. Se você não esperava este convite, ignore este e-mail.', 'font-size:16px'), 'padding:16px 0 0');
  return montar('pt', { assunto: 'Você foi chamado pra equipe do PUKAS', rotulo: 'PAINEL · EQUIPE', linhas, sair: null, rodape: RODAPE_PAINEL });
}

export function emailSenha(): Email {
  const linhas =
    titulo('Trocar a senha do painel') +
    paragrafos(['Alguém pediu pra trocar a senha desta conta no painel do PUKAS. Se foi você, clique no botão e escolha uma senha nova.']) +
    botao('ESCOLHER SENHA NOVA', LINK_SUPABASE) +
    linha(paragrafo('Se não foi você, ignore este e-mail: a senha continua a mesma. E avise o editor, porque alguém tentou entrar com o seu e-mail.', 'font-size:16px'), 'padding:16px 0 0');
  return montar('pt', { assunto: 'Trocar a senha do painel do PUKAS', rotulo: 'PAINEL · SENHA', linhas, sair: null, rodape: RODAPE_PAINEL });
}
