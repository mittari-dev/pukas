// globalSetup dos testes de banco: lê as chaves do Supabase local, a não ser que já venham do ambiente (CI).
import { execSync } from 'node:child_process';

export default function preparar() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY) return;
  const saida = execSync('npx supabase status -o env', { encoding: 'utf-8' });
  const valor = (nome: string) => saida.match(new RegExp(`^${nome}="?([^"\\n]+)"?`, 'm'))?.[1];
  process.env.SUPABASE_URL ??= valor('API_URL');
  process.env.SUPABASE_ANON_KEY = valor('ANON_KEY');
  process.env.SUPABASE_SERVICE_ROLE_KEY = valor('SERVICE_ROLE_KEY');
}
