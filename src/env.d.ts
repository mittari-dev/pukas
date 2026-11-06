/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Etiquetas de cache da página (src/lib/cache.ts); o middleware junta "tudo".
    etiquetas?: string[];
  }
}
