-- ============================================================================
-- HB+ (hbplus.fit) Production Supabase PostgreSQL Schema & RLS Setup
-- Safe to run multiple times (Idempotent) in Supabase SQL Editor
-- ============================================================================

-- 1. Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (char_length(email) <= 254),
  full_name text not null default '' check (char_length(full_name) <= 100),
  avatar_url text not null default '' check (char_length(avatar_url) <= 500),
  role text not null default 'user' check (role in ('user', 'admin')),
  assigned_program text not null default 'Strength Hypertrophy',
  domain_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create daily wellness telemetry table
create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  workout_completed boolean not null default false,
  completed_exercises_count integer not null default 2 check (completed_exercises_count between 0 and 20),
  workout_streak integer not null default 14 check (workout_streak >= 0),
  calories_consumed integer not null default 1760 check (calories_consumed >= 0),
  protein_grams integer not null default 132 check (protein_grams >= 0),
  carbs_grams integer not null default 168 check (carbs_grams >= 0),
  fats_grams integer not null default 51 check (fats_grams >= 0),
  water_glasses integer not null default 6 check (water_glasses between 0 and 40),
  steps_count integer not null default 8450 check (steps_count >= 0),
  mindfulness_streak integer not null default 9 check (mindfulness_streak >= 0),
  breathwork_sessions integer not null default 3 check (breathwork_sessions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create domain whitelist settings table for Admin RBAC portal
create table if not exists public.domain_settings (
  id text primary key default 'global',
  allowed_domains text[] not null default array['hbplus.fit'],
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Seed default global domain setting (@hbplus.fit)
insert into public.domain_settings (id, allowed_domains)
values ('global', array['hbplus.fit'])
on conflict (id) do nothing;

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.wellness_logs enable row level security;
alter table public.domain_settings enable row level security;

-- Helper function to check admin role without recursive RLS loops
create or replace function public.is_hbplus_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. RLS Policies for profiles (drop first so re-running script never errors)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_hbplus_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and (
      role = 'user'
      or (role = 'admin' and lower(email) in ('admin@hbplus.fit', 'csmishra952@gmail.com'))
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_hbplus_admin())
  with check (public.is_hbplus_admin());

-- 6. RLS Policies for wellness_logs
drop policy if exists "Users can read and write own wellness logs" on public.wellness_logs;
create policy "Users can read and write own wellness logs"
  on public.wellness_logs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view all wellness logs" on public.wellness_logs;
create policy "Admins can view all wellness logs"
  on public.wellness_logs
  for select
  to authenticated
  using (public.is_hbplus_admin());

-- 7. RLS Policies for domain_settings
drop policy if exists "Authenticated users can read domain whitelist" on public.domain_settings;
create policy "Authenticated users can read domain whitelist"
  on public.domain_settings
  for select
  to authenticated
  using (true);

drop policy if exists "Only admins can modify domain whitelist" on public.domain_settings;
create policy "Only admins can modify domain whitelist"
  on public.domain_settings
  for all
  to authenticated
  using (public.is_hbplus_admin())
  with check (public.is_hbplus_admin());
