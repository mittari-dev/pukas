// Única porta de entrada das páginas e do RSS para edições e obras: aplica as regras antes de publicar.
// Em espanhol, devolve só o que tem tradução, já mesclado, e trava se a tradução mudar algum número.
import { getCollection } from 'astro:content';
import { formatarNumero } from './formato';
import { edicoesPublicadas, validarNumerosUnicos, validarPublicavel, type Edicao } from './edicoes';
import { obrasPublicadas, validarNumerosObras, validarObra, type Obra } from './cultura';
import { aplicarTraducoes, mesclarEdicao, mesclarObra, type MarcaTraducao } from './traducao';
import type { Idioma } from './idioma';

export type EdicaoIdioma = Edicao & MarcaTraducao & { body?: string };
export type ObraIdioma = Obra & MarcaTraducao & { body?: string };

export async function carregarObras(idioma: Idioma = 'pt'): Promise<ObraIdioma[]> {
  const todas = (await getCollection('cultura')) as ObraIdioma[];
  validarNumerosObras(todas);
  const erros = todas
    .filter((o) => !o.data.rascunho)
    .map((o) => [o, validarObra(o)] as const)
    .filter(([, problemas]) => problemas.length > 0)
    .map(([o, problemas]) => `Obra ${formatarNumero(o.data.numero)} (${o.id}): ${problemas.join('; ')}`);
  if (erros.length) throw new Error(`Publicação bloqueada na Cultura:\n${erros.join('\n')}`);
  const publicadas = obrasPublicadas(todas) as ObraIdioma[];
  if (idioma === 'pt') return publicadas;
  return aplicarTraducoes(publicadas, await getCollection('culturaEs'), mesclarObra);
}

export async function carregarEdicoes(idioma: Idioma = 'pt'): Promise<EdicaoIdioma[]> {
  const todas = (await getCollection('newsletter')) as EdicaoIdioma[];
  validarNumerosUnicos(todas);
  const erros = todas
    .filter((e) => !e.data.rascunho)
    .map((e) => [e, validarPublicavel(e)] as const)
    .filter(([, problemas]) => problemas.length > 0)
    .map(([e, problemas]) => `Edição ${formatarNumero(e.data.numero)} (${e.id}): ${problemas.join('; ')}`);
  if (erros.length) throw new Error(`Publicação bloqueada pela checagem:\n${erros.join('\n')}`);
  const publicadas = edicoesPublicadas(todas) as EdicaoIdioma[];
  if (idioma === 'pt') return publicadas;
  return aplicarTraducoes(publicadas, await getCollection('newsletterEs'), mesclarEdicao);
}
