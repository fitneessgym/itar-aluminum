-- إطار workspace snapshot (Postgres / Neon / Supabase-compatible)
create table if not exists itar_workspace (
  user_id    text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);
