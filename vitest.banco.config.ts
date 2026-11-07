/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

// Testes contra o Supabase local: regras do banco (travas, RLS, histórico). Rodam em série, no mesmo banco.
export default defineConfig({
  test: {
    include: ['tests/banco/**/*.test.ts', 'tests/retrato/**/*.test.ts'],
    globalSetup: ['tests/banco/preparar.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
