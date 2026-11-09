// Curtir uma peça. Sem número público: só a equipe vê quantas (painel). Uma curtida por rede e por peça, pelo IP
// embaralhado com VOTO_SEGREDO: sem cookie, e um robô que apaga cookies não infla a contagem (revisão de segurança, 08/11).
import type { APIRoute } from 'astro';
import { hashSecreto, ipDaRequisicao } from '../../lib/votacoes/voto';
import { mestre } from '../../lib/banco/equipe';

export const POST: APIRoute = async ({ request }) => {
  const { peca } = (await request.json().catch(() => ({}))) as { peca?: unknown };
  const segredo = process.env.VOTO_SEGREDO ?? import.meta.env.VOTO_SEGREDO;
  if (typeof peca !== 'string' || !/^[0-9a-f-]{36}$/.test(peca) || !segredo) return new Response(null, { status: 400 });
  const db = mestre();
  const { data: p } = await db.from('pecas').select('id').eq('id', peca).eq('estado', 'publicada').maybeSingle();
  if (!p) return new Response(null, { status: 404 });
  const rede = await hashSecreto(segredo, `curtida:${ipDaRequisicao(request.headers)}`);
  const { error } = await db.from('curtidas').upsert({ peca_id: peca, aparelho_hash: rede }, { ignoreDuplicates: true });
  if (error) console.error('curtir:', error.message);
  return new Response(null, { status: error ? 500 : 204, headers: { 'Cache-Control': 'private, no-store' } });
};
