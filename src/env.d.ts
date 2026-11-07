/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Etiquetas de cache da página (src/lib/cache.ts); o middleware junta "tudo".
    etiquetas?: string[];
    // Rotas /admin: cliente com a sessão da pessoa e, depois do 2FA, quem ela é.
    painel?: {
      cliente: import('@supabase/supabase-js').SupabaseClient;
      usuario?: { id: string; email: string; nome: string; papel: import('./lib/painel/travas').Papel };
    };
  }
}
