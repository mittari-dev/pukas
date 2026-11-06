import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Campos de prova (fonte primária, licença, checagem) são opcionais aqui para que rascunhos
// possam estar incompletos. A obrigatoriedade para publicar fica em lib/edicoes.ts.
const newsletter = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/newsletter' }),
  schema: ({ image }) =>
    z.object({
      serie: z.enum(['memoria-operaria']),
      numero: z.number().int().min(1),
      titulo: z.string().min(1),
      publicadaEm: z.coerce.date(),
      resumo: z.string().min(1).max(280),
      legenda: z.string().max(2200).optional(),
      foto: z.object({
        arquivo: image(),
        descricao: z.string().min(1),
        credito: z.string().optional(),
        licenca: z.string().optional(),
        origem: z.url().optional(),
      }),
      fontes: z
        .array(
          z.object({
            titulo: z.string().min(1),
            instituicao: z.string().min(1),
            url: z.url(),
            tipo: z.enum(['primaria', 'secundaria']),
            acessadaEm: z.coerce.date(),
          }),
        )
        .default([]),
      checagem: z.object({ por: z.string().min(1), em: z.coerce.date() }).optional(),
      correcoes: z.array(z.object({ em: z.coerce.date(), texto: z.string().min(1) })).default([]),
      rascunho: z.boolean().default(false),
    }),
});

export const collections = { newsletter };
