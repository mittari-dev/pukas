// A lista "pronto para publicar?" do painel. Mesmas regras e mensagens do gatilho pecas_travas
// (supabase/migrations) e de validarPublicavel/validarObra: o banco é a autoridade, isto só mostra.
import type { Fonte } from '../edicoes';
import { MAX_PALAVRAS_MANCHETE, contarPalavras } from '../edicoes';

export type TipoPeca = 'newsletter' | 'cultura' | 'noticia' | 'pagina' | 'votacao';
export type EstadoPeca = 'rascunho' | 'em_revisao' | 'publicada' | 'rejeitada';
export type Papel = 'editor' | 'revisor' | 'redator';

export interface FotoEntrada {
  caminho: string;
  descricao: string;
  credito?: string;
  licenca?: string;
  origem?: string;
}

export interface PecaEntrada {
  tipo: TipoPeca;
  serie?: string;
  numero?: number;
  slug?: string;
  subtipo?: 'conto' | 'cena' | 'poema' | 'ensaio';
  autoria: string;
  titulo: string;
  resumo: string;
  legenda?: string;
  aviso?: string;
  corpo: string;
  foto?: FotoEntrada;
  video?: string;
  fontes: Fonte[];
  checagem?: { por: string; em: Date };
  traduzir: boolean;
  estado: EstadoPeca;
}

export interface Trava {
  chave: string;
  ok: boolean;
  rotulo: string;
  mensagem: string;
}

const vazio = (s?: string) => !s?.trim();

export function travasDaPeca(p: PecaEntrada): Trava[] {
  const travas: Trava[] = [];
  const trava = (chave: string, ok: boolean, rotulo: string, mensagem: string) => travas.push({ chave, ok, rotulo, mensagem });

  if (p.tipo === 'newsletter') trava('fonte', p.fontes.some((f) => f.tipo === 'primaria'), 'Fonte primária', 'sem fonte primária');
  if (p.tipo === 'noticia') trava('fonte', p.fontes.length > 0, 'Fonte', 'sem fonte');

  const prefixo = p.tipo === 'cultura' ? 'capa' : 'foto';
  const olhaFoto = p.tipo === 'newsletter' || ((p.tipo === 'noticia' || p.tipo === 'cultura') && p.foto);
  if (p.tipo === 'newsletter') {
    trava('foto', Boolean(p.foto?.caminho), 'Foto', 'sem foto');
    if (p.foto?.caminho) trava('foto_descricao', !vazio(p.foto.descricao), 'Descrição da foto', 'foto sem descrição');
  }
  if (olhaFoto) {
    trava(`${prefixo}_licenca`, !vazio(p.foto?.licenca), `Licença da ${prefixo}`, `${prefixo} sem licença`);
    trava(`${prefixo}_credito`, !vazio(p.foto?.credito), `Crédito da ${prefixo}`, `${prefixo} sem crédito`);
  }

  if (p.tipo === 'newsletter' || p.tipo === 'noticia') {
    trava('checagem', Boolean(p.checagem), 'Checagem', 'sem checagem');
    const n = contarPalavras(p.titulo);
    trava('manchete', n <= MAX_PALAVRAS_MANCHETE, `Manchete com até ${MAX_PALAVRAS_MANCHETE} palavras`, `manchete com ${n} palavras (máx. ${MAX_PALAVRAS_MANCHETE})`);
  }
  return travas;
}
