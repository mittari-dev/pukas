// Única porta de entrada das páginas e do RSS para edições e obras: aplica as regras antes de publicar.
import { getCollection } from 'astro:content';
import { formatarNumero } from './formato';
import { edicoesPublicadas, validarNumerosUnicos, validarPublicavel, type Edicao } from './edicoes';
import { obrasPublicadas, validarNumerosObras, validarObra, type Obra } from './cultura';

export async function carregarObras(): Promise<Obra[]> {
  const todas = (await getCollection('cultura')) as Obra[];
  validarNumerosObras(todas);
  const erros = todas
    .filter((o) => !o.data.rascunho)
    .map((o) => [o, validarObra(o)] as const)
    .filter(([, problemas]) => problemas.length > 0)
    .map(([o, problemas]) => `Obra ${formatarNumero(o.data.numero)} (${o.id}): ${problemas.join('; ')}`);
  if (erros.length) throw new Error(`Publicação bloqueada na Cultura:\n${erros.join('\n')}`);
  return obrasPublicadas(todas);
}

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
