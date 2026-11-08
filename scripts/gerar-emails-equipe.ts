// Gera os modelos de e-mail da equipe para colar no Supabase (Authentication → Emails → Templates).
// Uso: npx tsx scripts/gerar-emails-equipe.ts   (rodar de novo quando mudar o desenho em src/lib/newsletter/emails.ts)
import { mkdirSync, writeFileSync } from 'node:fs';
import { emailConvite, emailSenha } from '../src/lib/newsletter/emails';

mkdirSync('supabase/templates', { recursive: true });
writeFileSync('supabase/templates/convite.html', emailConvite().html);
writeFileSync('supabase/templates/senha.html', emailSenha().html);
console.log('supabase/templates/convite.html e senha.html gerados');
