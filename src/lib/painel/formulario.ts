// Formulário da peça (painel) ↔ PecaEntrada ↔ linha do banco.
import type { Fonte } from '../edicoes';
import type { EstadoPeca, PecaEntrada, TipoPeca } from './travas';
import { ehLinkWeb } from '../link';

const texto = (f: FormData, nome: string) => {
  const v = f.get(nome);
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};
const data = (s?: string) => (s ? new Date(s) : undefined);
const dia = (d?: Date) => (d ? d.toISOString().slice(0, 10) : null);

// Fontes chegam como fonte[0][titulo], fonte[0][url]...; linha sem título nem link é ignorada.
function fontes(f: FormData): Fonte[] {
  const indices = new Set([...f.keys()].map((k) => k.match(/^fonte\[(\d+)\]/)?.[1]).filter((i): i is string => i !== undefined));
  return [...indices]
    .sort((a, b) => Number(a) - Number(b))
    .map((i) => ({
      titulo: texto(f, `fonte[${i}][titulo]`) ?? '',
      instituicao: texto(f, `fonte[${i}][instituicao]`) ?? '',
      url: texto(f, `fonte[${i}][url]`) ?? '',
      tipo: texto(f, `fonte[${i}][tipo]`) === 'primaria' ? ('primaria' as const) : ('secundaria' as const),
      acessadaEm: data(texto(f, `fonte[${i}][acessadaEm]`)) ?? new Date(),
    }))
    .filter((x) => x.titulo || x.url);
}

export function lerFormularioPeca(f: FormData, tipo: TipoPeca, estado: EstadoPeca): PecaEntrada {
  const numero = texto(f, 'numero');
  const caminho = texto(f, 'foto_caminho');
  const porQuem = texto(f, 'checagem_por');
  return {
    tipo,
    estado,
    serie: texto(f, 'serie'),
    numero: numero ? Number(numero) : undefined,
    slug: texto(f, 'slug'),
    subtipo: texto(f, 'subtipo') as PecaEntrada['subtipo'],
    autoria: texto(f, 'autoria') ?? 'PUKAS',
    titulo: texto(f, 'titulo') ?? '',
    resumo: texto(f, 'resumo') ?? '',
    legenda: texto(f, 'legenda'),
    aviso: texto(f, 'aviso'),
    corpo: (f.get('corpo') as string | null)?.trim() ?? '',
    video: texto(f, 'video'),
    foto: caminho
      ? { caminho, descricao: texto(f, 'foto_descricao') ?? '', credito: texto(f, 'foto_credito'), licenca: texto(f, 'foto_licenca'), origem: texto(f, 'foto_origem') }
      : undefined,
    fontes: fontes(f),
    checagem: porQuem ? { por: porQuem, em: data(texto(f, 'checagem_em')) ?? new Date() } : undefined,
    traduzir: f.get('traduzir') === 'on',
  };
}

export function paraLinha(p: PecaEntrada): Record<string, unknown> {
  return {
    tipo: p.tipo,
    estado: p.estado,
    serie: p.serie ?? null,
    numero: p.numero ?? null,
    slug: p.slug ?? null,
    subtipo: p.subtipo ?? null,
    autoria: p.autoria,
    titulo: p.titulo,
    resumo: p.resumo,
    legenda: p.legenda ?? null,
    aviso: p.aviso ?? null,
    corpo: p.corpo,
    video: p.video ?? null,
    foto_caminho: p.foto?.caminho ?? null,
    foto_descricao: p.foto?.descricao ?? null,
    foto_credito: p.foto?.credito ?? null,
    foto_licenca: p.foto?.licenca ?? null,
    foto_origem: p.foto?.origem ?? null,
    fontes: p.fontes.map((f) => ({ ...f, acessadaEm: dia(f.acessadaEm) })),
    checagem: p.checagem ? { por: p.checagem.por, em: dia(p.checagem.em) } : null,
    traduzir: p.traduzir,
  };
}

// Links que não são http(s) (javascript:, data:…) são recusados ao salvar; o site também os descarta ao mostrar.
export function linksInvalidos(p: PecaEntrada): string[] {
  const ruim = (u?: string) => Boolean(u) && !ehLinkWeb(u!);
  return [
    ...p.fontes.filter((f) => ruim(f.url)).map((f) => `fonte "${f.titulo || f.url}"`),
    ...(ruim(p.foto?.origem) ? ['origem da foto'] : []),
    ...(ruim(p.video) ? ['vídeo'] : []),
  ];
}

// Mudou algo que a tradução cobre? Correção numa peça já traduzida precisa de tradução nova.
export function textoMudou(
  antes: { titulo: string; resumo: string; legenda: string | null; aviso: string | null; corpo: string },
  depois: PecaEntrada,
): boolean {
  return (
    antes.titulo !== depois.titulo || antes.resumo !== depois.resumo || (antes.legenda ?? undefined) !== depois.legenda ||
    (antes.aviso ?? undefined) !== depois.aviso || antes.corpo.trim() !== depois.corpo
  );
}
