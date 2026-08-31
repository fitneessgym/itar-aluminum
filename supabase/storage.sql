-- Run after the main database schema. The bucket is private; the app's
-- server-only SUPABASE_SERVICE_ROLE_KEY handles all Storage operations.
insert into storage.buckets (id, name, public)
values ('giant-files', 'giant-files', false)
on conflict (id) do update set public = false;
