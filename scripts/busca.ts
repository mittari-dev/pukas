// Robô de notícias (spec busca §5). Roda no GitHub Actions a cada 15 min:
// 1) se é hora, põe a rodada agendada na fila; 2) faz a rodada da fila (pauta); 3) escreve os rascunhos pedidos.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... npx tsx scripts/busca.ts
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { formatoPauta, formatoRascunho, pedidoPauta, pedidoRascunho, validarPauta, type CandidataPauta } from '../src/lib/busca/pedido';
import { custoBrl, custoMedio, horaDeRodar, inicioDoMes, podeRodar } from '../src/lib/busca/regras';
import { ErroDoRobo, conversar, diario, slugDoRobo, textoFinal, urlsVistas, type Uso } from '../src/lib/busca/robo';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !process.env.ANTHROPIC_API_KEY) throw new Error('Faltam segredos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const api = new Anthropic().messages;
const agora = new Date();

const { data: cfg, error: erroCfg } = await db.from('busca_config').select('*').single();
if (erroCfg) throw new Error(erroCfg.message);
const cambio = Number(cfg.cambio);

// 1) Rodada agendada.
const { data: ultima } = await db.from('busca_rodadas').select('criada_em').is('pedida_por', null).order('criada_em', { ascending: false }).limit(1).maybeSingle();
if (horaDeRodar(agora, cfg, ultima ? new Date(ultima.criada_em) : null)) {
  await db.from('busca_rodadas').insert({ estado: 'na_fila', pedida_por: null });
  console.log('rodada agendada na fila');
}

// Gasto do mês e custo médio, para o teto.
const { data: doMes } = await db.from('busca_rodadas').select('custo_brl').gte('criada_em', inicioDoMes(agora)).order('criada_em', { ascending: false });
let gasto = (doMes ?? []).reduce((s, r) => s + Number(r.custo_brl), 0);
const medio = custoMedio(doMes ?? []);

async function registrar(id: string, uso: Uso, campos: Record<string, unknown>) {
  const custo = custoBrl(uso, cambio);
  gasto += custo;
  await db.from('busca_rodadas').update({ ...campos, buscas: uso.buscas, tokens_entrada: uso.entrada, tokens_saida: uso.saida, custo_brl: custo, terminou_em: new Date().toISOString() }).eq('id', id);
}

// 2) Pauta: pega uma rodada da fila (a troca na_fila → rodando é a trava contra duas execuções).
const { data: fila } = await db.from('busca_rodadas').select('id').eq('estado', 'na_fila').order('criada_em').limit(1).maybeSingle();
if (fila) {
  const { data: pega } = await db.from('busca_rodadas').update({ estado: 'rodando', comecou_em: new Date().toISOString() }).eq('id', fila.id).eq('estado', 'na_fila').select('id');
  if (pega?.length) {
    if (!podeRodar(gasto, Number(cfg.teto_brl), medio)) {
      await db.from('busca_rodadas').update({ estado: 'teto', terminou_em: new Date().toISOString() }).eq('id', fila.id);
      console.log(`teto atingido: R$ ${gasto.toFixed(2)} de R$ ${cfg.teto_brl}`);
    } else {
      const { data: fontes } = await db.from('busca_fontes').select('dominio').eq('ativa', true);
      const { data: descartes } = await db.from('busca_candidatas').select('titulo, motivo_descarte').eq('estado', 'descartada').not('motivo_descarte', 'is', null).order('criada_em', { ascending: false }).limit(20);
      let uso: Uso = { entrada: 0, saida: 0, buscas: 0 };
      try {
        const r = await conversar(api, pedidoPauta(cfg, (fontes ?? []).map((f) => f.dominio), (descartes ?? []).map((d) => ({ titulo: d.titulo, motivo: d.motivo_descarte! }))));
        uso = r.uso;
        console.log(diario(r.blocos).join('\n'));
        console.log(`fim: ${r.mensagem.stop_reason}\n${textoFinal(r.mensagem).slice(0, 3000)}`);
        const { candidatas, descartadas } = validarPauta(formatoPauta.parse(textoFinal(r.mensagem)), cfg.max_candidatas, urlsVistas(r.blocos));
        if (candidatas.length) {
          const { error } = await db.from('busca_candidatas').insert(candidatas.map((c) => ({ rodada_id: fila.id, ...c, falta_confirmar: c.falta_confirmar ?? null })));
          if (error) throw new Error(error.message);
        }
        const aviso = [candidatas.length ? '' : 'nenhuma candidata nesta rodada', descartadas ? `${descartadas} candidata(s) sem fonte válida ficaram de fora` : ''].filter(Boolean).join('; ');
        await registrar(fila.id, uso, { estado: 'pronta', erro: aviso || null });
        console.log(`pauta pronta: ${candidatas.length} candidata(s)`);
      } catch (e) {
        await registrar(fila.id, e instanceof ErroDoRobo ? e.uso : uso, { estado: 'erro', erro: e instanceof Error ? e.message : String(e) });
        console.error('rodada com erro:', e);
      }
    }
  }
}

// 3) Rascunhos pedidos pela redação.
const { data: pedidas } = await db.from('busca_candidatas').select('id, rodada_id, titulo, porque, fontes, falta_confirmar').eq('estado', 'pedida').limit(3);
for (const c of pedidas ?? []) {
  if (!podeRodar(gasto, Number(cfg.teto_brl), medio / 2)) {
    console.log('teto atingido: rascunhos ficam para depois');
    break;
  }
  const { data: rodada } = await db.from('busca_rodadas').select('custo_brl, buscas, tokens_entrada, tokens_saida').eq('id', c.rodada_id).single();
  try {
    const r = await conversar(api, pedidoRascunho(c as unknown as CandidataPauta));
    const texto = formatoRascunho.parse(textoFinal(r.mensagem));
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: peca, error } = await db
      .from('pecas')
      .insert({
        tipo: 'noticia',
        estado: 'em_revisao',
        slug: slugDoRobo(texto.titulo, c.id.slice(0, 6)),
        autoria: 'PUKAS',
        titulo: texto.titulo,
        resumo: texto.resumo.slice(0, 280),
        corpo: texto.corpo,
        fontes: texto.fontes.map((f) => ({ titulo: f.titulo, instituicao: f.veiculo, url: f.url, tipo: 'secundaria', acessadaEm: hoje })),
        traduzir: true,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    await db.from('busca_candidatas').update({ estado: 'rascunho', peca_id: peca.id }).eq('id', c.id);
    // O custo do rascunho soma na rodada de onde a candidata saiu.
    const custo = custoBrl(r.uso, cambio);
    gasto += custo;
    await db
      .from('busca_rodadas')
      .update({ custo_brl: Number(rodada!.custo_brl) + custo, buscas: rodada!.buscas + r.uso.buscas, tokens_entrada: rodada!.tokens_entrada + r.uso.entrada, tokens_saida: rodada!.tokens_saida + r.uso.saida })
      .eq('id', c.rodada_id);
    console.log(`rascunho escrito: ${texto.titulo}`);
  } catch (e) {
    console.error(`rascunho de "${c.titulo}" falhou:`, e);
  }
}
