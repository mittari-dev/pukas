// Curtir uma peça. Sem número público: só a equipe vê quantas (painel). Uma curtida por aparelho, pelo mesmo
// código embaralhado das votações (cookie pk_aparelho).
import type { APIRoute } from 'astro';
import { hashSecreto } from '../../lib/votacoes/voto';
import { mestre } from '../../lib/banco/equipe';

const UM_ANO = 31536000;
const novoAparelho = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');

export const POST: APIRoute = async ({ request, cookies }) => {
  const { peca } = (await request.json().catch(() => ({}))) as { peca?: unknown };
  const segredo = process.env.VOTO_SEGREDO ?? import.meta.env.VOTO_SEGREDO;
  if (typeof peca !== 'string' || !/^[0-9a-f-]{36}$/.test(peca) || !segredo) return new Response(null, { status: 400 });
  const db = mestre();
  const { data: p } = await db.from('pecas').select('id').eq('id', peca).eq('estado', 'publicada').maybeSingle();
  if (!p) return new Response(null, { status: 404 });
  let aparelho = cookies.get('pk_aparelho')?.value ?? '';
  if (!/^[0-9a-f]{64}$/.test(aparelho)) aparelho = novoAparelho();
  cookies.set('pk_aparelho', aparelho, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: UM_ANO });
  const { error } = await db.from('curtidas').upsert({ peca_id: peca, aparelho_hash: await hashSecreto(segredo, aparelho) }, { ignoreDuplicates: true });
  if (error) console.error('curtir:', error.message);
  return new Response(null, { status: error ? 500 : 204, headers: { 'Cache-Control': 'private, no-store' } });
};
