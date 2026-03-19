-- Create `entries` table for diary content + Gemini response.
-- Idempotent: safe to run even if the table already exists.

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  created_at date default current_date not null,
  content text,
  mode text check (mode in ('禅', 'ライバル', '秘書')),
  ai_response text,
  sync_score int check (sync_score between 0 and 100),
  unique (user_id, created_at)
);

-- Ensure columns exist (for existing installs)
alter table public.entries
  add column if not exists content text;

alter table public.entries
  add column if not exists mode text;

alter table public.entries
  add column if not exists ai_response text;

alter table public.entries
  add column if not exists sync_score int;

