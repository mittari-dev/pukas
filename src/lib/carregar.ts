// Única porta de entrada das páginas e do RSS para as edições.
import { getCollection } from 'astro:content';
import { formatarNumero } from './formato';
import { edicoesPublicadas, validarNumerosUnicos, validarPublicavel, type Edicao } from './edicoes';

export async function carregarEdicoes(): Promise<Edicao[]> {
  const todas = (await getCollection('newsletter')) as Edicao[];
  validarNumerosUnicos(todas);
  const erros = todas
    .filter((e) => !e.data.rascunho)
    .map((e) => [e, validarPublicavel(e)] as const)
    .filter(([, problemas]) => problemas.length > 0)
    .map(([e, problemas]) => `Edição ${formatarNumero(e.data.numero)} (${e.id}): ${problemas.join('; ')}`);
  if (erros.length) throw new Error(`Publicação bloqueada pela checagem:\n${erros.join('\n')}`);
  return edicoesPublicadas(todas);
}
