-- Screenshot storage policies: scoping kept, evaluation made cheap, and the
-- policies tied to signed-in callers explicitly.
--
-- Two changes, both to the same three policies on the private
-- `trade-screenshots` bucket:
--
--   1. `auth.uid()` becomes `(select auth.uid())`. Written bare, Postgres
--      treats it as volatile and calls it once per row examined; wrapped in a
--      scalar sub-select it is evaluated once for the whole statement and the
--      result is compared against the index. Every other policy in this schema
--      already uses the wrapped form: these three were the exception.
--
--   2. `to authenticated` is stated. Without it a policy is defined for every
--      role, including `anon`. It still refuses an anonymous caller, because
--      `auth.uid()` is null for one and the comparison then yields null rather
--      than true, but a policy that never applies is better not evaluated, and
--      the intent is better written down than inferred.
--
-- Nothing about who can reach which file changes: a file stays readable only
-- by the account whose id is the first folder in its path.

drop policy if exists "Users upload own screenshots" on storage.objects;
drop policy if exists "Users read own screenshots"   on storage.objects;
drop policy if exists "Users delete own screenshots" on storage.objects;

create policy "Users upload own screenshots"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users read own screenshots"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete own screenshots"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
