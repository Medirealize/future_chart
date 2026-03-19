-- Onboarding columns for profiles
-- user_type: A/B/C
-- target_years: default 20
-- future_title: future shoulder title
-- core_value: selected core phrase

create table if not exists public.profiles (
  id uuid primary key references auth.users not null,
  updated_at timestamp with time zone default now()
);

alter table public.profiles add column if not exists user_type text;
alter table public.profiles add column if not exists target_years int default 20;
alter table public.profiles add column if not exists future_title text;
alter table public.profiles add column if not exists core_value text;

-- Ensure default exists even if the column was added earlier
alter table public.profiles alter column target_years set default 20;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_user_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_user_type_check
      check (user_type in ('A', 'B', 'C'));
  end if;
end $$;

