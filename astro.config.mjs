// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Sem domínio ainda: PUBLIC_SITE_URL troca para https://pukas.lat quando ele existir.
const site = process.env.PUBLIC_SITE_URL ?? 'https://pukas.vercel.app';
// As fotos ficam no Storage do Supabase; a Vercel as redimensiona (src/lib/imagem.ts).
const banco = new URL(process.env.SUPABASE_URL ?? 'https://jyasvubglgiopgtfdyak.supabase.co').hostname;

// Conteúdo no Supabase: páginas geradas no servidor e guardadas no cache da borda (src/middleware.ts).
export default defineConfig({
  site,
  output: 'server',
  adapter: vercel({
    // Contagem de visitas da Vercel: sem cookie e sem dado pessoal, só números agregados (está na /privacidade).
    webAnalytics: { enabled: true },
    imagesConfig: { sizes: [400, 800, 1200, 1600], domains: [banco], formats: ['image/avif', 'image/webp'] },
  }),
  // A página começa a carregar quando o dedo encosta no link (ou o mouse passa por cima), antes do clique terminar.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
