// Quem pode fazer o quê no painel (spec §4). As políticas de RLS repetem esta matriz no banco.
import type { EstadoPeca, Papel } from './travas';

export type Acao = 'editar' | 'enviar_revisao' | 'rejeitar' | 'publicar' | 'corrigir';

const antesDoAr: EstadoPeca[] = ['rascunho', 'em_revisao', 'rejeitada'];

export function pode(papel: Papel, acao: Acao, estado: EstadoPeca): boolean {
  const editor = papel === 'editor';
  switch (acao) {
    case 'editar':
      return estado === 'publicada' ? editor : true;
    case 'enviar_revisao':
      return estado === 'rascunho' || estado === 'rejeitada';
    case 'rejeitar':
      return papel !== 'redator' && (estado === 'rascunho' || estado === 'em_revisao');
    case 'publicar':
      return editor && antesDoAr.includes(estado);
    case 'corrigir':
      return editor && estado === 'publicada';
  }
}

// "Salvar" mantém o estado, menos numa peça rejeitada: mexer nela é retomar o trabalho, então volta a rascunho.
// (A RLS não deixa o redator gravar uma peça como 'rejeitada'.)
export function destinoAoSalvar(estado: EstadoPeca): EstadoPeca {
  return estado === 'rejeitada' ? 'rascunho' : estado;
}
