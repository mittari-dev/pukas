// Regras da página da equipe (/painel/equipe): convite, troca de papel e saída. Só o editor mexe.
import type { Papel } from './travas';

type Leitura<T> = { ok: true; valor: T } | { ok: false; erro: string };

const PAPEIS: Papel[] = ['editor', 'revisor', 'redator'];
const MIN_SENHA = 12;

export function lerConvite(f: FormData): Leitura<{ email: string; nome: string; papel: Papel }> {
  const email = String(f.get('email') ?? '').trim().toLowerCase();
  const nome = String(f.get('nome') ?? '').trim();
  const papel = String(f.get('papel') ?? '') as Papel;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, erro: 'Escreva um e-mail válido.' };
  if (!nome) return { ok: false, erro: 'Escreva o nome da pessoa.' };
  if (!PAPEIS.includes(papel)) return { ok: false, erro: 'Escolha o papel: editor, revisor ou redator.' };
  return { ok: true, valor: { email, nome, papel } };
}

// Devolve o motivo da recusa, ou null se pode.
export function mudancaNaEquipe(eu: { id: string; papel: Papel }, alvo: string, acao: 'papel' | 'remover'): string | null {
  if (eu.papel !== 'editor') return 'Só quem é editor mexe na equipe.';
  if (alvo === eu.id) return acao === 'remover' ? 'Você não pode tirar a si mesmo da equipe.' : 'Você não pode mudar o próprio papel.';
  return null;
}

export function lerSenhaNova(f: FormData): Leitura<string> {
  const senha = String(f.get('senha') ?? '');
  if (senha.length < MIN_SENHA) return { ok: false, erro: `A senha precisa de pelo menos ${MIN_SENHA} caracteres.` };
  if (senha !== String(f.get('repetir') ?? '')) return { ok: false, erro: 'As duas senhas não são iguais.' };
  return { ok: true, valor: senha };
}
