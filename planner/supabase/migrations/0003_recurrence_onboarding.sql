-- Recurrence on blocks + onboarding flag
alter table public.blocks
  add column if not exists recurrence text,
  add column if not exists recurrence_group_id text,
  add column if not exists note text;

alter table public.user_settings
  add column if not exists onboarding_complete boolean not null default false;
