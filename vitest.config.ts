/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Fuso do público: pega erros de data que em UTC passariam despercebidos.
    env: { TZ: 'America/Sao_Paulo' },
  },
});
