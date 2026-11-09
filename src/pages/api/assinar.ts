// Formulário de assinar a newsletter. Responde sempre 303 para /newsletter com a situação na URL (a página mostra o aviso).
import type { APIRoute } from 'astro';
import { conferirTurnstile } from '../../lib/votacoes/turnstile';
import { ipDaRequisicao } from '../../lib/votacoes/voto';
import { emailValido } from '../../lib/newsletter/emails';
import { paginaNewsletter, pedirAssinatura } from '../../lib/newsletter/fluxo';
import { seriesEscolhidas } from '../../lib/newsletter/series';
import { clientePublico } from '../../lib/banco/cliente';

export const POST: APIRoute = async ({ request, site }) => {
  const form = await request.formData().catch(() => new FormData());
  const idioma = form.get('idioma') === 'es' ? 'es' : 'pt';
  const voltar = (situacao: string) => new Response(null, { status: 303, headers: { Location: paginaNewsletter(idioma, situacao), 'Cache-Control': 'private, no-store' } });
  // Campo escondido preenchido: robô. Finge que deu certo.
  if (String(form.get('site') ?? '')) return voltar('enviada');
  const email = emailValido(String(form.get('email') ?? ''));
  if (!email) return voltar('erro');
  if (!(await conferirTurnstile(String(form.get('cf-turnstile-response') ?? ''), ipDaRequisicao(request.headers)))) return voltar('robo');
  try {
    // Já assinante ou pedido repetido dá a mesma resposta: o formulário não revela quem está na lista.
    const { data: ativas } = await clientePublico().from('series').select('slug').eq('ativa', true);
    const series = seriesEscolhidas(form.getAll('serie').map(String), (ativas ?? []).map((s) => s.slug));
    await pedirAssinatura(email, idioma, site!.origin, series);
    return voltar('enviada');
  } catch (e) {
    console.error('assinar:', e);
    return voltar('erro');
  }
};
