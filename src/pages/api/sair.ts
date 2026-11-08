// Sair da newsletter. GET mostra um botão (leitor de e-mail que abre links sozinho não tira ninguém da lista);
// POST apaga: é o que o botão manda e o que o Gmail manda no "cancelar inscrição" em um clique (RFC 8058).
import type { APIRoute } from 'astro';
import { idiomaDoToken, paginaNewsletter, sair } from '../../lib/newsletter/fluxo';

const valido = (t: string) => /^[0-9a-f]{64}$/.test(t);
const TEXTO = {
  pt: { titulo: 'Sair da newsletter', pergunta: 'Quer parar de receber o PUKAS por e-mail? O seu e-mail será apagado da lista.', botao: 'Sair da lista' },
  es: { titulo: 'Salir de la newsletter', pergunta: '¿Quieres dejar de recibir PUKAS por correo? Tu correo se borrará de la lista.', botao: 'Salir de la lista' },
};

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('t') ?? '';
  const idioma = valido(token) ? await idiomaDoToken(token) : null;
  if (!idioma) return new Response(null, { status: 303, headers: { Location: paginaNewsletter('pt', 'saiu'), 'Cache-Control': 'private, no-store' } });
  const t = TEXTO[idioma];
  const html = `<!doctype html><html lang="${idioma === 'es' ? 'es' : 'pt-BR'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${t.titulo} · PUKAS</title></head><body style="margin:0;padding:48px 16px;background:#f2ede4;color:#141414;font-family:Arial,Helvetica,sans-serif;font-size:18px"><main style="max-width:520px;margin:0 auto"><h1 style="text-transform:uppercase">${t.titulo}</h1><p>${t.pergunta}</p><form method="post" action="/api/sair?t=${token}"><button style="background:#141414;color:#f2ede4;border:0;padding:12px 20px;font-size:17px;font-weight:bold;cursor:pointer">${t.botao}</button></form></main></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
};

export const POST: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('t') ?? '';
  const idioma = (valido(token) && (await idiomaDoToken(token))) || 'pt';
  if (valido(token)) await sair(token);
  return new Response(null, { status: 303, headers: { Location: paginaNewsletter(idioma, 'saiu'), 'Cache-Control': 'private, no-store' } });
};
