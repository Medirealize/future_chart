-- Enable RLS and restrict `profiles` to the authenticated user only.
-- Required for onboarding flow:
-- - read existing profile (select)
-- - upsert profile (insert/update)

alter table public.profiles enable row level security;

-- SELECT: a user can read only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

-- INSERT: a user can create only their own profile
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- UPDATE: a user can update only their own profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- (Optional) DELETE: a user can delete only their own profile
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

