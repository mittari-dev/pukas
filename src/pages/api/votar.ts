// O voto do público (spec consultas §4). Responde sempre 303 de volta para a votação; o resultado vai num cookie curto,
// e o comprovante nunca vai na URL: a página o acha pelo cookie do aparelho.
import type { APIRoute } from 'astro';
import { conferirTurnstile } from '../../lib/votacoes/turnstile';
import { ehOpcao, gerarComprovante, hashSecreto, ipDaRequisicao, limparRelato, motivoDescarte } from '../../lib/votacoes/voto';
import { apagarConta, estaFechada, gravarVoto, validosDaRedeNaHora, votacaoAberta, votoDaConta, votoDoAparelho } from '../../lib/banco/votos';
import { clienteDaRequisicao } from '../../lib/banco/cliente';
import { comConta, sessaoGoogle } from '../../lib/votacoes/conta';

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
    // Tudo o que vem depois de achar a votação. No alto impacto, roda dentro do login Google, que é apagado no fim.
    const registrar = async (contaHash: string | null): Promise<Desfecho> => {
      const opcao = campo('opcao');
      if (!ehOpcao(opcao)) return 'erro';

      const ip = ipDaRequisicao(request.headers);
      if (!(await conferirTurnstile(campo('cf-turnstile-response'), ip))) return 'robo';

      let aparelho = cookies.get('pk_aparelho')?.value ?? '';
      if (!/^[0-9a-f]{64}$/.test(aparelho)) aparelho = novoAparelho();
      cookies.set('pk_aparelho', aparelho, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: UM_ANO });
      const aparelhoHash = await hashSecreto(segredo, aparelho);
      if (await votoDoAparelho(v.id, aparelhoHash)) return 'ja';
      if (contaHash && (await votoDaConta(v.id, contaHash))) return 'ja';

      const { relato, erro } = limparRelato(form.get('relato'));
      if (erro) return 'erro';
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
          conta_hash: contaHash,
        },
        gerarComprovante,
      );
      if ('fechada' in r) return 'fechada';
      // Honeypot e rede cheia respondem "ok" de propósito: o descarte é silencioso e aparece na metodologia.
      return r.ja ? 'ja' : 'ok';
    };
    if (!v.alto_impacto) return responder(await registrar(null));
    const db = clienteDaRequisicao({ request, cookies });
    const { data } = await db.auth.getUser();
    const d = await comConta(sessaoGoogle(data.user), segredo, registrar, async (uid) => {
      await db.auth.signOut({ scope: 'local' }).catch(() => {});
      await apagarConta(uid);
    });
    return responder(d);
  } catch (e) {
    console.error('votar:', (e as Error).message);
    return responder('erro');
  }
};
