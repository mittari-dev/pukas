// O voto do público (spec consultas §4). Responde sempre 303 de volta para a votação; o resultado vai num cookie curto,
// e o comprovante nunca vai na URL: a página o acha pelo cookie do aparelho.
import type { APIRoute } from 'astro';
import { conferirTurnstile } from '../../lib/votacoes/turnstile';
import { ehOpcao, gerarComprovante, hashSecreto, ipDaRequisicao, limparRelato, motivoDescarte } from '../../lib/votacoes/voto';
import { estaFechada, gravarVoto, validosDaRedeNaHora, votacaoAberta, votoDoAparelho } from '../../lib/banco/votos';

type Desfecho = 'ok' | 'ja' | 'fechada' | 'robo' | 'erro';

const UM_ANO = 31536000;
const novoAparelho = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData().catch(() => new FormData());
  const campo = (n: string) => String(form.get(n) ?? '');
  const slug = campo('votacao');
  const valido = /^[a-z0-9-]{1,80}$/.test(slug);
  let es = false;
  try {
    es = new URL(request.headers.get('referer') ?? '').pathname.startsWith('/es/');
  } catch {
    // Sem Referer, volta em português.
  }
  const destino = `${es ? '/es' : ''}/votacoes${valido ? `/${slug}` : ''}`;
  const responder = (d: Desfecho) => {
    cookies.set('pk_voto', d, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 });
    return new Response(null, { status: 303, headers: { Location: destino, 'Cache-Control': 'private, no-store' } });
  };

  const segredo = process.env.VOTO_SEGREDO ?? import.meta.env.VOTO_SEGREDO;
  if (!segredo || !valido) return responder('erro');

  try {
    const v = await votacaoAberta(slug);
    if (!v || estaFechada(v)) return responder('fechada');
    const opcao = campo('opcao');
    if (!ehOpcao(opcao)) return responder('erro');

    const ip = ipDaRequisicao(request.headers);
    if (!(await conferirTurnstile(campo('cf-turnstile-response'), ip))) return responder('robo');

    let aparelho = cookies.get('pk_aparelho')?.value ?? '';
    if (!/^[0-9a-f]{64}$/.test(aparelho)) aparelho = novoAparelho();
    cookies.set('pk_aparelho', aparelho, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: UM_ANO });
    const aparelhoHash = await hashSecreto(segredo, aparelho);
    if (await votoDoAparelho(v.id, aparelhoHash)) return responder('ja');

    const { relato, erro } = limparRelato(form.get('relato'));
    if (erro) return responder('erro');
    const ipHash = await hashSecreto(segredo, ip);
    const motivo = motivoDescarte({ honeypot: campo('site'), validosDaRedeNaHora: await validosDaRedeNaHora(v.id, ipHash) });

    const r = await gravarVoto(
      {
        votacao_id: v.id,
        opcao,
        relato,
        citar: Boolean(relato) && form.get('citar') === 'on',
        comprovante: gerarComprovante(),
        aparelho_hash: aparelhoHash,
        ip_hash: ipHash,
        descartado: motivo !== null,
        motivo,
      },
      gerarComprovante,
    );
    if ('fechada' in r) return responder('fechada');
    // Honeypot e rede cheia respondem "ok" de propósito: o descarte é silencioso e aparece na metodologia.
    return responder(r.ja ? 'ja' : 'ok');
  } catch (e) {
    console.error('votar:', (e as Error).message);
    return responder('erro');
  }
};
