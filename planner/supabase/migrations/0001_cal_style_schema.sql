-- Cal-style normalized schema (minimal complete)
-- Run in Supabase SQL editor or via migration tooling.

-- User settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pomodoro_work integer not null default 25,
  pomodoro_break integer not null default 5,
  pomodoro_long_break integer not null default 15,
  pomodoro_sessions integer not null default 4,
  accent_color text not null default 'indigo',
  compact_mode boolean not null default false,
  gamification_enabled boolean not null default true,
  migrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Weeks (Monday key)
create table if not exists public.weeks (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

-- Days (one row per calendar date)
create table if not exists public.days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  wake_time integer not null,
  work_start integer not null,
  sleep_target integer not null,
  commute_mins integer not null,
  actual_wake_time integer,
  actual_wake_date date,
  actual_sleep_time integer,
  actual_sleep_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Blocks (one row per block instance)
create table if not exists public.blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  block_id text not null,
  sort_order integer not null,
  type text not null,
  label text not null,
  dur integer not null,
  enabled boolean not null default true,
  completed boolean not null default false,
  actual_start integer,
  actual_start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date, block_id),
  foreign key (user_id, date) references public.days(user_id, date) on delete cascade
);

-- Journal entries (one row per date)
create table if not exists public.journal_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mood integer,
  energy integer,
  intention text not null default '',
  reflection text not null default '',
  gratitude_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date),
  foreign key (user_id, date) references public.days(user_id, date) on delete cascade
);

-- Optional: archived aggregates
create table if not exists public.week_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key date not null,
  aggregates_json jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

-- RLS
alter table public.user_settings enable row level security;
alter table public.weeks enable row level security;
alter table public.days enable row level security;
alter table public.blocks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.week_snapshots enable row level security;

-- Policies: user_id must match auth.uid()
do $$ begin
  create policy "user_settings_owner" on public.user_settings
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "weeks_owner" on public.weeks
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "days_owner" on public.days
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "blocks_owner" on public.blocks
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "journal_entries_owner" on public.journal_entries
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "week_snapshots_owner" on public.week_snapshots
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

