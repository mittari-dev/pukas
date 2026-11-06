// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Sem domínio ainda: PUBLIC_SITE_URL troca para https://pukas.lat quando ele existir.
const site = process.env.PUBLIC_SITE_URL ?? 'https://pukas.vercel.app';

// Conteúdo no Supabase: páginas geradas no servidor e guardadas no cache da borda (src/middleware.ts).
export default defineConfig({
  site,
  output: 'server',
  adapter: vercel(),
});
