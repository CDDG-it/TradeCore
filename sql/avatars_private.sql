-- Profile photos: a private bucket, readable only by its owner.
--
-- The schema file has always created this bucket as public, with a read policy
-- of `bucket_id = 'avatars'` and no further condition. The path is
-- `{user_id}/avatar.{ext}`, so under that policy a user's id was enough to
-- fetch their face. This project never ran that part, so no photo was ever
-- exposed: the bucket does not exist yet and uploading a profile photo fails
-- with "Bucket not found".
--
-- This creates it closed instead, and works either way: on a project that did
-- run the old version, it flips the bucket to private and replaces the open
-- read policy.
--
-- The app signs a short-lived link at the moment it shows a photo, so nothing
-- on screen depends on the bucket being public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public avatar read"   on storage.objects;
drop policy if exists "Users read own avatar" on storage.objects;
drop policy if exists "Users upload own avatar" on storage.objects;
drop policy if exists "Users update own avatar" on storage.objects;
drop policy if exists "Users delete own avatar" on storage.objects;

create policy "Users read own avatar"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Replacing a photo is an upsert, so the update policy is what makes
-- "Replace photo" work rather than failing on the second upload.
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
