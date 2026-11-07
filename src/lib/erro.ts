// Página "volte em instantes" (503) quando o banco não responde. Sem layout nem banco: tem que sair mesmo com tudo caído.
// Única exceção à regra das cores só em tokens.css: os hex abaixo são os mesmos de lá (Cal, Tinta, Pau-Brasil).
import { LANG, semPrefixo, t } from './idioma';

export function paginaDeErro(caminho: string): Response {
  const { idioma } = semPrefixo(caminho);
  const html = `<!doctype html>
<html lang="${LANG[idioma]}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${t(idioma, 'erro.titulo')} · PUKAS</title>
<style>body{margin:0;background:#F1EDE4;color:#1C1A17;font:500 19px/1.5 system-ui,sans-serif;padding:16px}main{max-width:36rem;margin:15vh auto}
.tarja{display:inline-block;background:#9E2A1E;color:#F1EDE4;font-weight:900;letter-spacing:.02em;padding:4px 12px;font-size:28px}
h1{font-size:clamp(40px,10vw,72px);line-height:.95;text-transform:uppercase;margin:24px 0 16px}</style></head>
<body><main><span class="tarja">PUKAS</span><h1>${t(idioma, 'erro.titulo')}</h1><p>${t(idioma, 'erro.texto')}</p></main></body>
</html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '30' } });
}
