// Envio pelo Resend, de 100 em 100 (limite da rota de lote). Sem SDK: é uma chamada só.
export interface Mensagem {
  para: string;
  assunto: string;
  html: string;
  text: string;
  sair: string | null;
}

const REMETENTE = 'PUKAS <newsletter@pukas.lat>';

export async function enviarLote(chave: string, mensagens: Mensagem[], opcoes: { responderPara?: string }, f: typeof fetch = fetch): Promise<{ enviados: number; falhas: number }> {
  let enviados = 0;
  let falhas = 0;
  for (let i = 0; i < mensagens.length; i += 100) {
    const lote = mensagens.slice(i, i + 100);
    const corpo = lote.map((m) => ({
      from: REMETENTE,
      to: [m.para],
      subject: m.assunto,
      html: m.html,
      text: m.text,
      ...(opcoes.responderPara ? { reply_to: opcoes.responderPara } : {}),
      // Sair em um clique (RFC 8058): o Gmail mostra o botão "cancelar inscrição" e manda POST para o link.
      ...(m.sair ? { headers: { 'List-Unsubscribe': `<${m.sair}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
    }));
    try {
      const r = await f('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { authorization: `Bearer ${chave}`, 'content-type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (r.ok) enviados += lote.length;
      else {
        falhas += lote.length;
        console.error('resend recusou o lote:', r.status, await r.text().catch(() => ''));
      }
    } catch (e) {
      falhas += lote.length;
      console.error('resend fora do ar:', e);
    }
  }
  return { enviados, falhas };
}
