// Achar a peça pelo endereço nas rotas dinâmicas (agora no servidor, sem getStaticPaths).
import type { EdicaoIdioma } from './carregar';

export const numeroDoEndereco = (n: number) => String(n).padStart(3, '0');

export function acharEdicao(edicoes: EdicaoIdioma[], serie: string | undefined, numero: string | undefined): number {
  return edicoes.findIndex((e) => e.data.serie === serie && numeroDoEndereco(e.data.numero) === numero);
}
