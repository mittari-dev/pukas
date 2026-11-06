// Tira o "retrato" do site: status, manchete e texto visível de cada endereço público.
// Uso: node scripts/retratar-site.ts http://localhost:4321 tests/retrato/site-atual.json
// Serve para provar que a troca dos arquivos pelo banco não mudou nenhuma página (tests/retrato).
import { writeFileSync } from 'node:fs';

export const ENDERECOS = ['/', '/links', '/manifesto', '/cultura', '/newsletter/memoria-operaria', '/rss.xml'].flatMap((c) => [
  c,
  c === '/' ? '/es/' : `/es${c}`,
]);

export interface Retrato {
  url: string;
  status: number;
  titulo: string;
  texto: string;
}

const limpar = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function retratar(url: string, status: number, corpo: string): Retrato {
  if (url.endsWith('.xml')) {
    return { url, status, titulo: corpo.match(/<title>([^<]*)<\/title>/)?.[1] ?? '', texto: limpar(corpo.replace(/<!\[CDATA\[|\]\]>/g, '')) };
  }
  return { url, status, titulo: limpar(corpo.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''), texto: limpar(corpo.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '') };
}

export async function retratarSite(base: string): Promise<Retrato[]> {
  const retratos: Retrato[] = [];
  for (const url of ENDERECOS) {
    // Sem seguir redirecionamento nem mandar idioma: o retrato é da página em si.
    const r = await fetch(new URL(url, base), { redirect: 'manual', headers: { 'accept-language': '' } });
    retratos.push(retratar(url, r.status, await r.text()));
  }
  return retratos;
}

if (import.meta.main) {
  const [base, saida] = process.argv.slice(2);
  if (!base || !saida) throw new Error('uso: node scripts/retratar-site.ts URL_BASE SAIDA.json');
  writeFileSync(saida, `${JSON.stringify(await retratarSite(base), null, 2)}\n`, 'utf-8');
  console.log(`retrato salvo em ${saida}`);
}
