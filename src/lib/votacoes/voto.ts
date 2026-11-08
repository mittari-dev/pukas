// Regras puras do voto (spec consultas §4). Sem banco e sem rede: a rota /api/votar só junta as peças.

export type Opcao = 'a_favor' | 'contra' | 'nao_sei';
export const OPCOES: Opcao[] = ['a_favor', 'contra', 'nao_sei'];
export const ehOpcao = (x: unknown): x is Opcao => OPCOES.includes(x as Opcao);

// Sem 0, O, 1, I, L e U: o comprovante é lido em voz alta e copiado à mão.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export function gerarComprovante(aleatorio: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  // 30 símbolos: o resto de um byte por 30 tem viés pequeno (256 = 8·30 + 16), aceitável para um código que não é segredo.
  return 'PK-' + Array.from(aleatorio(6), (b) => ALFABETO[b % ALFABETO.length]).join('');
}

export async function hashSecreto(segredo: string, valor: string): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(valor));
  return Array.from(new Uint8Array(assinatura), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function ipDaRequisicao(h: Headers): string {
  const primeiro = (v: string | null) => v?.split(',')[0].trim() || null;
  return primeiro(h.get('x-vercel-forwarded-for')) ?? primeiro(h.get('x-forwarded-for')) ?? primeiro(h.get('x-real-ip')) ?? 'desconhecido';
}

export const LIMITE_REDE_HORA = 30;

export function motivoDescarte(x: { honeypot: string; validosDaRedeNaHora: number }): string | null {
  if (x.honeypot) return 'campo escondido preenchido';
  if (x.validosDaRedeNaHora >= LIMITE_REDE_HORA) return 'muitos votos da mesma rede';
  return null;
}

export function limparRelato(s: unknown): { relato: string | null; erro?: string } {
  const t = typeof s === 'string' ? s.trim() : '';
  if (!t) return { relato: null };
  if (t.length > 1000) return { relato: null, erro: 'relato_longo' };
  return { relato: t };
}

export type Visao = 'so_total' | 'parcial' | 'final';
export const oQueMostrar = (x: { votou: boolean; fechada: boolean }): Visao => (x.fechada ? 'final' : x.votou ? 'parcial' : 'so_total');

// Porcentagem inteira de cada opção; a soma pode dar 99 ou 101, e a página mostra o número absoluto ao lado.
export function porcentagens(r: Record<Opcao, number>): Record<Opcao, number> & { total: number } {
  const total = r.a_favor + r.contra + r.nao_sei;
  const pct = (n: number) => (total ? Math.round((100 * n) / total) : 0);
  return { a_favor: pct(r.a_favor), contra: pct(r.contra), nao_sei: pct(r.nao_sei), total };
}
