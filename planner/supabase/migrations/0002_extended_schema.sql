-- Extended schema: subtasks, habits, app metadata dual-write support
-- Run after 0001_cal_style_schema.sql

alter table public.blocks
  add column if not exists subtasks_json jsonb not null default '[]'::jsonb;

alter table public.user_settings
  add column if not exists quick_notes text not null default '',
  add column if not exists categories_json jsonb not null default '[]'::jsonb,
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb,
  add column if not exists app_meta_json jsonb not null default '{}'::jsonb;

create table if not exists public.habits (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  name text not null,
  emoji text not null default '💧',
  frequency text not null,
  custom_days jsonb,
  target_count integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

create table if not exists public.habit_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key date not null,
  habit_id text not null,
  day_key text not null,
  completed boolean not null default true,
  primary key (user_id, week_key, habit_id, day_key)
);

alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

do $$ begin
  create policy "habits_owner" on public.habits
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "habit_completions_owner" on public.habit_completions
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
