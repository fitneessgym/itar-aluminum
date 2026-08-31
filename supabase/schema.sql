-- إطار — schema compatible with Supabase SQL editor (Postgres)
-- Run this in the Supabase SQL tab, then point DATABASE_URL at the project.

create table if not exists itar_workspace (
  user_id    text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table itar_workspace enable row level security;
