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
  pt: { texto: 'Você recebe isto porque assinou em pukas.lat.', sair: 'Sair da lista' },
  es: { texto: 'Recibes esto porque te suscribiste en pukas.lat.', sair: 'Salir de la lista' },
};

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

function montar(idioma: Idioma, assunto: string, corpoHtml: string, sair: string | null): Email {
  const r = RODAPE[idioma];
  const rodape = sair ? `<p style="font-size:13px;color:#555">${r.texto} <a href="${escapar(sair)}" style="color:#555">${r.sair}</a></p>` : '';
  const html = `<!doctype html><html lang="${idioma === 'es' ? 'es' : 'pt-BR'}"><body style="margin:0;padding:24px 16px;background:#f2ede4;color:#141414;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5"><div style="max-width:600px;margin:0 auto"><p style="margin:0 0 24px"><span style="background:#a3241b;color:#f2ede4;font-weight:900;padding:4px 10px;letter-spacing:1px">PUKAS</span></p>${corpoHtml}<hr style="border:0;border-top:1px solid #141414;margin:32px 0 16px">${rodape}</div></body></html>`;
  const text = `${semTags(corpoHtml.replace(/<\/(p|h\d|li)>/g, '\n\n').replace(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)'))}${sair ? `\n${r.texto} ${r.sair}: ${sair}` : ''}`.trim();
  return { assunto, html, text };
}

const paragrafos = (lista: string[]) => lista.map((p) => `<p>${escapar(p)}</p>`).join('');
const botao = (texto: string, link: string) =>
  `<p style="margin:24px 0"><a href="${escapar(link)}" style="display:inline-block;background:#141414;color:#f2ede4;padding:12px 20px;text-decoration:none;font-weight:bold">${escapar(texto)}</a></p>`;

export function montarBoasVindas(idioma: Idioma, passo: number, site: string, sair: string): Email {
  const t = BOAS_VINDAS[idioma][passo];
  const ler = idioma === 'es' ? 'Ir a PUKAS' : 'Ir para o PUKAS';
  return montar(idioma, t.assunto, paragrafos(t.paragrafos) + botao(ler, idioma === 'es' ? `${site}/es` : site), sair);
}

export function emailConfirmacao(idioma: Idioma, link: string): Email {
  return idioma === 'es'
    ? montar('es', 'Confirma tu suscripción a PUKAS', paragrafos(['Alguien (seguramente tú) pidió recibir PUKAS en este correo. Para confirmar, haz clic en el botón.']) + botao('Confirmar suscripción', link) + paragrafos(['Si no fuiste tú, ignora este correo: sin la confirmación, no te mandamos nada más.']), null)
    : montar('pt', 'Confirme sua assinatura do PUKAS', paragrafos(['Alguém (provavelmente você) pediu pra receber o PUKAS neste e-mail. Pra confirmar, clique no botão.']) + botao('Confirmar assinatura', link) + paragrafos(['Se não foi você, é só ignorar este e-mail: sem a confirmação, a gente não manda mais nada.']), null);
}

export function emailEdicao(idioma: Idioma, e: { titulo: string; resumo: string; corpoHtml: string; link: string }, sair: string): Email {
  const ler = idioma === 'es' ? 'Leer en el sitio' : 'Ler no site';
  const corpo = `<h1 style="font-size:28px;line-height:1.1;text-transform:uppercase;margin:0 0 12px">${escapar(e.titulo)}</h1><p style="font-size:19px"><strong>${escapar(e.resumo)}</strong></p>${e.corpoHtml}${botao(ler, e.link)}`;
  return montar(idioma, e.titulo, corpo, sair);
}
