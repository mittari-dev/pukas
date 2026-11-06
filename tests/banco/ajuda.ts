// Ajudas dos testes de banco: rodam contra o Supabase local (`npx supabase start`).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const URL_LOCAL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';

export function chave(nome: 'ANON_KEY' | 'SERVICE_ROLE_KEY'): string {
  const v = process.env[`SUPABASE_${nome}`];
  if (!v) throw new Error(`SUPABASE_${nome} não definida (o globalSetup lê de "supabase status")`);
  return v;
}

const semSessao = { auth: { persistSession: false, autoRefreshToken: false } };

export const clienteServico = (): SupabaseClient => createClient(URL_LOCAL, chave('SERVICE_ROLE_KEY'), semSessao);
export const clienteAnonimo = (): SupabaseClient => createClient(URL_LOCAL, chave('ANON_KEY'), semSessao);

let contador = 0;
const unico = () => `${Date.now()}${contador++}`;

const fontePrimaria = {
  titulo: 'Decreto-Lei 5.452',
  instituicao: 'Planalto',
  url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  tipo: 'primaria',
  acessadaEm: '2026-11-01',
};

// Uma peça completa e válida para publicar, por tipo. Números e slugs únicos a cada chamada.
export function pecaValida(tipo: 'newsletter' | 'cultura' | 'noticia' | 'pagina'): Record<string, unknown> {
  const u = unico();
  const base = { tipo, titulo: 'Direito | nenhum caiu | do céu.', resumo: 'Resumo.', corpo: 'Texto.', estado: 'publicada' };
  const foto = { foto_caminho: 'teste.jpg', foto_descricao: 'Operários', foto_credito: 'Arquivo', foto_licenca: 'Domínio público' };
  const checagem = { por: 'Fundador', em: '2026-11-01' };
  switch (tipo) {
    case 'newsletter':
      return { ...base, ...foto, serie: 'memoria-operaria', numero: Number(u.slice(-6)), fontes: [fontePrimaria], checagem };
    case 'noticia':
      return { ...base, slug: `noticia-${u}`, fontes: [{ ...fontePrimaria, tipo: 'secundaria' }], checagem };
    case 'cultura':
      return { ...base, subtipo: 'conto', numero: Number(u.slice(-6)), fontes: [] };
    case 'pagina':
      return { ...base, slug: `pagina-${u}`, fontes: [] };
  }
}
