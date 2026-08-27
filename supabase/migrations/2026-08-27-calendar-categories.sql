-- ============================================================
-- Calendar categories + coursework fields
-- Run once in the Supabase SQL Editor against the existing DB.
--
-- Additive only: creates one new table, adds three nullable/defaulted
-- columns to calendar_events, and adds RLS policies. No existing row,
-- column, or policy is dropped or modified. Safe to re-run.
-- ============================================================

create table if not exists event_categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  color         text not null default 'blue',
  is_coursework boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, name)
);

alter table event_categories enable row level security;

-- Postgres has no "create policy if not exists", so each policy is guarded
-- on pg_policies rather than dropped and recreated.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_categories' and policyname = 'Users can view own event categories'
  ) then
    create policy "Users can view own event categories"
      on event_categories for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_categories' and policyname = 'Users can insert own event categories'
  ) then
    create policy "Users can insert own event categories"
      on event_categories for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_categories' and policyname = 'Users can update own event categories'
  ) then
    create policy "Users can update own event categories"
      on event_categories for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_categories' and policyname = 'Users can delete own event categories'
  ) then
    create policy "Users can delete own event categories"
      on event_categories for delete
      using (auth.uid() = user_id);
  end if;
end $$;

alter table calendar_events
  add column if not exists category_id uuid references event_categories(id) on delete set null,
  add column if not exists course      text,
  add column if not exists completed   boolean not null default false;

create index if not exists calendar_events_category_idx
  on calendar_events (user_id, category_id);
