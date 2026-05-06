-- Slike koje učenik uploaduje uz predaju domaćeg.
-- Storage je u Supabase Storage bucket-u 'homework-submissions' (public read).
-- Ova kolona čuva URL-ove (max 5).

alter table public.homework
  add column submission_images jsonb not null default '[]'::jsonb;

-- Bucket — kreiramo SQL-om jer želimo idempotentno (re-run safe).
-- Public read = URL-ovi rade bez auth-a; pisanje samo preko service_role
-- (klijent uploaduje kroz našu server action).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-submissions',
  'homework-submissions',
  true,
  5 * 1024 * 1024, -- 5 MB po fajlu
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
