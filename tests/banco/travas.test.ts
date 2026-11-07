// Travas editoriais e histórico no banco (spec painel §3). Valem até para a chave mestra.
import { describe, expect, test } from 'vitest';
import { clienteServico, pecaValida } from './ajuda';

const db = clienteServico();

async function inserir(linha: Record<string, unknown>) {
  return db.from('pecas').insert(linha).select().single();
}

describe('travas ao publicar', () => {
  test('recusa publicar newsletter sem checagem', async () => {
    const { error } = await inserir({ ...pecaValida('newsletter'), checagem: null });
    expect(error?.message).toContain('sem checagem');
  });

  test('recusa newsletter sem fonte primária', async () => {
    const p = pecaValida('newsletter');
    const { error } = await inserir({ ...p, fontes: [{ ...(p.fontes as object[])[0], tipo: 'secundaria' }] });
    expect(error?.message).toContain('sem fonte primária');
  });

  test('recusa newsletter sem foto e sem descrição da foto', async () => {
    const semFoto = { ...pecaValida('newsletter'), foto_caminho: null, foto_descricao: null };
    expect((await servico.from('pecas').insert(semFoto)).error?.message).toContain('sem foto');
    const semDescricao = { ...pecaValida('newsletter'), foto_descricao: '' };
    expect((await servico.from('pecas').insert(semDescricao)).error?.message).toContain('foto sem descrição');
  });

  test('recusa foto sem licença e sem crédito', async () => {
    const { error } = await inserir({ ...pecaValida('newsletter'), foto_licenca: null, foto_credito: ' ' });
    expect(error?.message).toContain('foto sem licença');
    expect(error?.message).toContain('foto sem crédito');
  });

  test('recusa manchete com 9 palavras', async () => {
    const { error } = await inserir({ ...pecaValida('newsletter'), titulo: 'um dois três quatro cinco seis sete oito nove' });
    expect(error?.message).toContain('manchete com 9 palavras (máx. 8)');
  });

  test('manchete com | e * conta só palavras', async () => {
    const { error } = await inserir({ ...pecaValida('newsletter'), titulo: 'Direito | nenhum caiu | do céu. | *Foi luta.*' });
    expect(error).toBeNull();
  });

  test('recusa editar peça publicada para ficar inválida', async () => {
    const { data } = await inserir(pecaValida('newsletter'));
    const { error } = await db.from('pecas').update({ checagem: null }).eq('id', data.id);
    expect(error?.message).toContain('sem checagem');
    const { data: depois } = await db.from('pecas').select('checagem').eq('id', data.id).single();
    expect(depois?.checagem).not.toBeNull();
  });

  test('rascunho pode ficar incompleto', async () => {
    const { error } = await inserir({ ...pecaValida('newsletter'), estado: 'rascunho', fontes: [], checagem: null, foto_licenca: null });
    expect(error).toBeNull();
  });

  test('noticia exige fonte e checagem, aceita fonte secundária', async () => {
    expect((await inserir(pecaValida('noticia'))).error).toBeNull();
    expect((await inserir({ ...pecaValida('noticia'), fontes: [] })).error?.message).toContain('sem fonte');
    expect((await inserir({ ...pecaValida('noticia'), checagem: null })).error?.message).toContain('sem checagem');
  });

  test('cultura com capa exige crédito e licença', async () => {
    const { error } = await inserir({ ...pecaValida('cultura'), foto_caminho: 'capa.jpg', foto_credito: 'X' });
    expect(error?.message).toContain('capa sem licença');
  });

  test('pagina publica sem fonte', async () => {
    expect((await inserir(pecaValida('pagina'))).error).toBeNull();
  });

  test('número repetido na série é recusado', async () => {
    const p = pecaValida('newsletter');
    await inserir(p);
    const { error } = await inserir({ ...pecaValida('newsletter'), numero: p.numero });
    expect(error?.code).toBe('23505');
  });
});

describe('histórico', () => {
  test('histórico guarda a versão anterior a cada update', async () => {
    const { data } = await inserir({ ...pecaValida('pagina'), titulo: 'Antes' });
    await db.from('pecas').update({ titulo: 'Depois' }).eq('id', data.id);
    const { data: hist } = await db.from('historico').select('acao, antes').eq('peca_id', data.id);
    expect(hist).toHaveLength(1);
    expect(hist?.[0].antes.titulo).toBe('Antes');
    expect(hist?.[0].acao).toBe('salvar');
  });

  test('publicar fica registrado como publicar', async () => {
    const { data } = await inserir({ ...pecaValida('pagina'), estado: 'rascunho' });
    await db.from('pecas').update({ estado: 'publicada' }).eq('id', data.id);
    const { data: hist } = await db.from('historico').select('acao').eq('peca_id', data.id);
    expect(hist?.map((h) => h.acao)).toEqual(['publicar']);
  });
});
