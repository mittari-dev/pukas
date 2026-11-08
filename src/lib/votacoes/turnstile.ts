// Anti-robô invisível: o servidor confere com a Cloudflare o atestado que o navegador mandou.
export async function conferirTurnstile(token: string, ip: string, f: typeof fetch = fetch): Promise<boolean> {
  const segredo = process.env.TURNSTILE_SECRET ?? import.meta.env.TURNSTILE_SECRET;
  if (!segredo || !token) return false;
  const corpo = new FormData();
  corpo.set('secret', segredo);
  corpo.set('response', token);
  if (ip !== 'desconhecido') corpo.set('remoteip', ip);
  try {
    const r = await f('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: corpo });
    return Boolean(((await r.json()) as { success?: boolean }).success);
  } catch {
    return false;
  }
}
