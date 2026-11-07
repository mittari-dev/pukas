// Ajudas dos testes de banco: rodam contra o Supabase local (`npx supabase start`).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { codigoTotp } from './totp';

export const URL_LOCAL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';

export function chave(nome: 'ANON_KEY' | 'SERVICE_ROLE_KEY'): string {
  const v = process.env[`SUPABASE_${nome}`];
  if (!v) throw new Error(`SUPABASE_${nome} não definida (o globalSetup lê de "supabase status")`);
  return v;
}

const semSessao = { auth: { persistSession: false, autoRefreshToken: false } };

export const clienteServico = (): SupabaseClient => createClient(URL_LOCAL, chave('SERVICE_ROLE_KEY'), semSessao);
export const clienteAnonimo = (): SupabaseClient => createClient(URL_LOCAL, chave('ANON_KEY'), semSessao);

// Cria uma conta com o papel dado e devolve um cliente logado nela; com aal2, já cadastra e verifica o TOTP.
export async function entrarComo(papel: 'editor' | 'revisor' | 'redator', { aal2 }: { aal2: boolean }): Promise<SupabaseClient> {
  const email = `${papel}-${unico()}@teste.pukas`;
  const senha = `senha-${unico()}-forte`;
  const servico = clienteServico();
  const { data: criado, error } = await servico.auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error) throw error;
  const { error: erroPerfil } = await servico.from('perfis').insert({ id: criado.user.id, nome: papel, papel });
  if (erroPerfil) throw erroPerfil;

  const cliente = clienteAnonimo();
  const { error: erroLogin } = await cliente.auth.signInWithPassword({ email, password: senha });
  if (erroLogin) throw erroLogin;
  if (aal2) {
    const { data: fator, error: erroFator } = await cliente.auth.mfa.enroll({ factorType: 'totp' });
    if (erroFator) throw erroFator;
    const { error: erroCodigo } = await cliente.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigoTotp(fator.totp.secret) });
    if (erroCodigo) throw erroCodigo;
  }
  return cliente;
}

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
export function pecaValida(tipo: 'newsletter' | 'cultura' | 'noticia' | 'pagina' | 'votacao'): Record<string, unknown> {
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
      return { ...base, subtipo: 'conto', numero: Number(u.slice(-6)), slug: `obra-${u}`, fontes: [] };
    case 'pagina':
      return { ...base, slug: `pagina-${u}`, fontes: [] };
    case 'votacao':
      return {
        ...base,
        slug: `votacao-${u}`,
        proposicao: { casa: 'camara', sigla: 'PEC', numero: 45, ano: 2019, id: '2196833', ementa: 'Altera o Sistema Tributário Nacional.', url: 'https://www.camara.leg.br/propostas-legislativas/2196833' },
        fontes: [{ ...fontePrimaria, tipo: 'secundaria' }],
        checagem,
      };
  }
}
