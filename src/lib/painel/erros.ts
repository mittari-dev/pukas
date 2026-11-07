// Erro do banco → frase para o painel. Nunca mostra o erro cru (pode vazar detalhe interno).
import { formatarNumero } from '../formato';

export function traduzirErroBanco(erro: { code?: string; message: string; details?: string }): string {
  if (erro.code === '23505') {
    const numero = erro.details?.match(/\(tipo, (?:serie, )?numero\)=\([^)]*?(\d+)\)/)?.[1];
    if (numero) return `Já existe a edição ${formatarNumero(Number(numero))}`;
    const slug = erro.details?.match(/\(tipo, slug\)=\([^,]+, ([^)]+)\)/)?.[1];
    if (slug) return `Já existe uma peça com o endereço "${slug}"`;
    if (erro.details?.includes('(peca_id)')) return 'Esta peça já está ligada a outro item.';
  }
  // 23503: a série escolhida não existe (chave estrangeira para series).
  if (erro.code === '23503' && erro.details?.includes('(serie)')) return 'Essa série não existe. Escolha outra na lista.';
  // P0001: as travas editoriais do gatilho pecas_travas, já escritas para gente.
  if (erro.code === 'P0001') return `Não dá para publicar: ${erro.message}`;
  return 'Não deu para salvar. Tente de novo.';
}
