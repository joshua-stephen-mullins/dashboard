-- ============================================================
-- Mead tab — batches + lab log
-- Run once in the Supabase SQL Editor against the existing DB.
--
-- Additive only: creates four new tables and their RLS policies.
-- No existing row, column, or policy is dropped or modified.
-- Safe to re-run.
--
-- Also create a public Storage bucket named `mead-images`
-- (Supabase dashboard → Storage → New bucket) for batch photos.
-- ============================================================

-- ── mead_batches ─────────────────────────────────────────────
-- One row per batch. Recipe + outcome live here; everything that
-- happens over time lives in the three child tables below.
--
-- ABV, attenuation, and the sweetness bucket are NOT stored — they
-- are derived from og/fg in src/tabs/mead/utils/calc.js so they can
-- never drift from the gravity readings they come from.
create table if not exists mead_batches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,

  -- identity
  name                text not null,
  batch_number        integer,
  style               text not null default 'traditional',
  status              text not null default 'planning',
  vessel              text,
  image_url           text,
  source_url          text,
  tags                text[] not null default '{}',

  -- declared style axes (BJCP requires all three)
  sweetness           text,
  carbonation         text default 'still',

  -- recipe
  batch_size_gal      numeric,
  honey_varietal      text,
  honey_source        text,
  honey_lbs           numeric,
  honey_cost          numeric,
  water_gal           numeric,
  adjuncts            jsonb not null default '[]',

  -- yeast
  yeast_strain        text,
  yeast_nitrogen_need text default 'medium',

  -- gravity
  target_og           numeric,
  target_abv          numeric,
  og                  numeric,
  fg                  numeric,

  -- dates
  brew_date           date,
  pitch_date          date,
  bottled_date        date,
  drink_by_date       date,

  -- packaging & outcome
  bottle_count        integer,
  bottles_remaining   integer,
  bottle_size         text,
  carbonation_method  text,
  rating              integer,
  tasting_notes       text,
  notes               text,

  created_at          timestamptz not null default now()
);

create index if not exists mead_batches_user_status_idx
  on mead_batches (user_id, status);

alter table mead_batches enable row level security;

-- ── mead_readings ────────────────────────────────────────────
-- Fermentation time series: gravity, temperature, pH.
create table if not exists mead_readings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  batch_id       uuid not null references mead_batches(id) on delete cascade,
  recorded_at    timestamptz not null default now(),
  gravity        numeric,
  temperature_f  numeric,
  ph             numeric,
  degassed       boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists mead_readings_batch_idx
  on mead_readings (batch_id, recorded_at);

alter table mead_readings enable row level security;

-- ── mead_additions ───────────────────────────────────────────
-- Anything put into the must after pitch. Nutrient doses are
-- generated from the TOSNA schedule with scheduled_at set and
-- added_at null until the dose is actually given.
create table if not exists mead_additions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  batch_id            uuid not null references mead_batches(id) on delete cascade,
  category            text not null default 'nutrient',
  product             text not null,
  amount              numeric,
  unit                text default 'g',
  dose_number         integer,
  scheduled_at        timestamptz,
  added_at            timestamptz,
  gravity_at_addition numeric,
  notes               text,
  created_at          timestamptz not null default now()
);

create index if not exists mead_additions_batch_idx
  on mead_additions (batch_id, scheduled_at);

alter table mead_additions enable row level security;

-- ── mead_events ──────────────────────────────────────────────
-- Process milestones: racking, stabilizing, backsweetening, bottling.
create table if not exists mead_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  batch_id      uuid not null references mead_batches(id) on delete cascade,
  event_type    text not null,
  occurred_at   timestamptz not null default now(),
  gravity       numeric,
  volume_lost   numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists mead_events_batch_idx
  on mead_events (batch_id, occurred_at);

alter table mead_events enable row level security;

-- ── RLS policies ─────────────────────────────────────────────
-- Postgres has no "create policy if not exists", so each policy is
-- guarded on pg_policies rather than dropped and recreated.
do $$
declare
  t text;
  action text;
  label text;
  policy_name text;
begin
  foreach t in array array['mead_batches', 'mead_readings', 'mead_additions', 'mead_events']
  loop
    foreach action in array array['select', 'insert', 'update', 'delete']
    loop
      label := case action
        when 'select' then 'view'
        when 'insert' then 'insert'
        when 'update' then 'update'
        else 'delete'
      end;
      policy_name := format('Users can %s own %s', label, t);

      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = t and policyname = policy_name
      ) then
        if action = 'insert' then
          execute format(
            'create policy %I on %I for insert with check (auth.uid() = user_id)',
            policy_name, t
          );
        else
          execute format(
            'create policy %I on %I for %s using (auth.uid() = user_id)',
            policy_name, t, action
          );
        end if;
      end if;
    end loop;
  end loop;
end $$;
