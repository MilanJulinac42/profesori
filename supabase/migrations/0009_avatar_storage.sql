-- Public bucket for profile photos. Files are organized as {org_id}/avatar-*.{ext}.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,                                                 -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read (public bucket).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

-- Authenticated users can upload only to their own org's folder.
drop policy if exists "avatars insert own org" on storage.objects;
create policy "avatars insert own org"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

drop policy if exists "avatars update own org" on storage.objects;
create policy "avatars update own org"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

drop policy if exists "avatars delete own org" on storage.objects;
create policy "avatars delete own org"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);
