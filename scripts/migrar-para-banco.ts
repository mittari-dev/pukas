// Copia o conteúdo de src/content/** para o Supabase (spec painel §6). Roda uma vez, com a chave mestra.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrar-para-banco.ts
// Idempotente: rodar de novo atualiza as mesmas peças, não duplica.
import { createClient } from '@supabase/supabase-js';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { parse as lerYaml } from 'yaml';

const RAIZ = join(import.meta.dirname, '..', 'src', 'content');
const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
const db = createClient(url, chave, { auth: { persistSession: false } });

type Dados = Record<string, any>;

function listar(pasta: string): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listar(join(pasta, e.name)) : e.name.endsWith('.mdx') ? [join(pasta, e.name)] : [],
  );
}

function lerMdx(caminho: string): { dados: Dados; corpo: string } {
  const m = readFileSync(caminho, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${caminho}: frontmatter não encontrado`);
  return { dados: (lerYaml(m[1]) ?? {}) as Dados, corpo: m[2].trim() };
}

const data = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);
const fontes = (lista: Dados[] = []) => lista.map((f) => ({ ...f, acessadaEm: data(f.acessadaEm) }));

async function enviarFoto(arquivoMdx: string, relativo: string | undefined, nome: string): Promise<string | null> {
  if (!relativo) return null;
  const local = join(dirname(arquivoMdx), relativo);
  if (!existsSync(local)) throw new Error(`${arquivoMdx}: foto ${relativo} não encontrada`);
  const destino = `${nome}${extname(local)}`;
  const tipo = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(local).toLowerCase()];
  const { error } = await db.storage.from('fotos').upload(destino, readFileSync(local), { contentType: tipo, upsert: true });
  if (error) throw error;
  return destino;
}

// Procura pela chave natural (série+número, ou tipo+slug) e atualiza; se não existe, insere.
async function gravar(linha: Dados, chaveNatural: Dados): Promise<string> {
  let q = db.from('pecas').select('id');
  for (const [k, v] of Object.entries(chaveNatural)) q = q.eq(k, v);
  const { data: achada, error: erroBusca } = await q.maybeSingle();
  if (erroBusca) throw erroBusca;
  const { data: gravada, error } = achada
    ? await db.from('pecas').update(linha).eq('id', achada.id).select('id').single()
    : await db.from('pecas').insert(linha).select('id').single();
  if (error) throw new Error(`${JSON.stringify(chaveNatural)}: ${error.message}`);
  return gravada.id;
}

async function gravarTraducao(pecaId: string, arquivoEs: string) {
  if (!existsSync(arquivoEs)) return;
  const { dados, corpo } = lerMdx(arquivoEs);
  const { error } = await db.from('traducoes').upsert({
    peca_id: pecaId,
    idioma: 'es',
    titulo: dados.titulo,
    resumo: dados.resumo,
    legenda: dados.legenda ?? null,
    aviso: dados.aviso ?? null,
    corpo,
    // Páginas não tinham selo de tradução automática: continuam sem (mesmo site de antes).
    revisado: dados.revisado ?? true,
    modelo: dados.modelo ?? 'manual',
    estado: 'pronta',
  });
  if (error) throw error;
}

async function gravarCorrecoes(pecaId: string, correcoes: Dados[] = []) {
  for (const c of correcoes) {
    const dia = data(c.em);
    const { data: existe } = await db.from('correcoes').select('id').eq('peca_id', pecaId).eq('data', dia).eq('texto', c.texto).maybeSingle();
    if (!existe) await db.from('correcoes').insert({ peca_id: pecaId, data: dia, texto: c.texto });
  }
}

const estado = (d: Dados) => (d.rascunho === false ? 'publicada' : 'rascunho');
const espelho = (arquivo: string) => join(RAIZ, 'es', relative(RAIZ, arquivo));

async function main() {
  let total = 0;
  for (const arq of listar(join(RAIZ, 'newsletter'))) {
    const { dados: d, corpo } = lerMdx(arq);
    const serie = d.serie;
    const linha = {
      tipo: 'newsletter', serie, numero: d.numero, titulo: d.titulo, resumo: d.resumo, legenda: d.legenda ?? null, corpo,
      foto_caminho: await enviarFoto(arq, d.foto?.arquivo, `${serie}-${d.numero}`),
      foto_descricao: d.foto?.descricao ?? null, foto_credito: d.foto?.credito ?? null, foto_licenca: d.foto?.licenca ?? null, foto_origem: d.foto?.origem ?? null,
      fontes: fontes(d.fontes), checagem: d.checagem ? { por: d.checagem.por, em: data(d.checagem.em) } : null,
      estado: estado(d), publicada_em: data(d.publicadaEm),
    };
    const id = await gravar(linha, { tipo: 'newsletter', serie, numero: d.numero });
    await gravarCorrecoes(id, d.correcoes);
    await gravarTraducao(id, espelho(arq));
    total++;
  }
  for (const arq of listar(join(RAIZ, 'cultura'))) {
    const { dados: d, corpo } = lerMdx(arq);
    const slug = basename(arq, '.mdx');
    const linha = {
      tipo: 'cultura', subtipo: d.tipo, numero: d.numero, slug, titulo: d.titulo, resumo: d.resumo, autoria: d.autoria ?? 'PUKAS',
      video: d.video ?? null, aviso: d.aviso ?? null, corpo, traduzir: d.traduzir ?? true,
      foto_caminho: await enviarFoto(arq, d.capa?.arquivo, `cultura-${d.numero}`),
      foto_descricao: d.capa?.descricao ?? null, foto_credito: d.capa?.credito ?? null, foto_licenca: d.capa?.licenca ?? null, foto_origem: d.capa?.origem ?? null,
      fontes: fontes(d.fontes), estado: estado(d), publicada_em: data(d.publicadaEm),
    };
    const id = await gravar(linha, { tipo: 'cultura', slug });
    await gravarTraducao(id, espelho(arq));
    total++;
  }
  for (const arq of listar(join(RAIZ, 'paginas'))) {
    const { dados: d, corpo } = lerMdx(arq);
    const slug = basename(arq, '.mdx');
    const id = await gravar({ tipo: 'pagina', slug, titulo: d.titulo, resumo: d.resumo, corpo, estado: estado(d) }, { tipo: 'pagina', slug });
    await gravarTraducao(id, espelho(arq));
    total++;
  }
  console.log(`${total} peça(s) gravada(s).`);
}

await main();
