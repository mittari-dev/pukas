// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Sem domínio ainda: PUBLIC_SITE_URL troca para https://pukas.lat quando ele existir.
const site = process.env.PUBLIC_SITE_URL ?? 'https://pukas.vercel.app';

export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx()],
});
