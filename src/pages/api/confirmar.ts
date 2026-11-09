// Link do e-mail de confirmação. GET só mostra o botão: antivírus de e-mail que abre links sozinho não confirma
// assinatura que ninguém pediu (revisão de segurança, 08/11). POST, que é o botão, confirma.
import type { APIRoute } from 'astro';
import { confirmar, idiomaDoToken, paginaNewsletter } from '../../lib/newsletter/fluxo';

const valido = (t: string) => /^[0-9a-f]{64}$/.test(t);
const TEXTO = {
  pt: { titulo: 'Confirmar assinatura', pergunta: 'Falta um clique pra receber o PUKAS por e-mail.', botao: 'CONFIRMAR ASSINATURA' },
  es: { titulo: 'Confirmar suscripción', pergunta: 'Falta un clic para recibir PUKAS por correo.', botao: 'CONFIRMAR SUSCRIPCIÓN' },
};
const voltar = (idioma: 'pt' | 'es', situacao: string) => new Response(null, { status: 303, headers: { Location: paginaNewsletter(idioma, situacao), 'Cache-Control': 'private, no-store' } });

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('t') ?? '';
  const idioma = valido(token) ? await idiomaDoToken(token) : null;
  if (!idioma) return voltar('pt', 'invalida');
  const t = TEXTO[idioma];
  const html = `<!doctype html><html lang="${idioma === 'es' ? 'es' : 'pt-BR'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${t.titulo} · PUKAS</title></head><body style="margin:0;padding:48px 16px;background:#F1EDE4;color:#1C1A17;font-family:Arial,Helvetica,sans-serif;font-size:18px"><main style="max-width:520px;margin:0 auto"><p style="margin:0 0 24px"><span style="background:#9E2A1E;color:#F1EDE4;font-weight:900;font-size:28px;padding:2px 12px">PUKAS</span></p><h1 style="text-transform:uppercase;line-height:1">${t.titulo}</h1><p>${t.pergunta}</p><form method="post" action="/api/confirmar?t=${token}"><button style="background:#1C1A17;color:#F1EDE4;border:0;padding:16px 24px;font-size:15px;font-weight:bold;letter-spacing:1px;cursor:pointer">${t.botao}</button></form></main></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
};

export const POST: APIRoute = async ({ url, site }) => {
  const token = url.searchParams.get('t') ?? '';
  let idioma = null;
  try {
    if (valido(token)) idioma = await confirmar(token, site!.origin);
  } catch (e) {
    console.error('confirmar:', e);
  }
  return voltar(idioma ?? 'pt', idioma ? 'confirmada' : 'invalida');
};
