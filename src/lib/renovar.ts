// Conferência do segredo do /api/renovar e das etiquetas pedidas.
import { timingSafeEqual } from 'node:crypto';

export function autorizado(cabecalho: string | null, segredo: string | undefined): boolean {
  if (!segredo || !cabecalho) return false;
  const a = Buffer.from(cabecalho);
  const b = Buffer.from(`Bearer ${segredo}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function etiquetasValidas(corpo: unknown): string[] {
  const lista = (corpo as { etiquetas?: unknown } | null)?.etiquetas;
  return Array.isArray(lista) ? lista.filter((e): e is string => typeof e === 'string' && /^[a-z]+(:[0-9a-z-]+)?$/.test(e)) : [];
}
