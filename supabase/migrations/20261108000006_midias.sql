-- Mídia no meio do texto (foto, vídeo, áudio). Pública como as fotos; só editor com 2FA envia.
-- 50 MB é o teto por arquivo do plano gratuito do Supabase.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('midias', 'midias', true, 52428800, array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'
  ]);

create policy midias_editor_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'midias' and privado.com_2fa() and privado.papel_atual() = 'editor');
