-- ============================================================
-- Dashboard schema
-- Paste this into the Supabase SQL Editor and run it.
-- ============================================================

-- ── soccer_followed_teams ────────────────────────────────────
create table if not exists soccer_followed_teams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  team_id     integer not null,
  team_name   text not null,
  league      text not null default '',
  created_at  timestamptz not null default now()
);

alter table soccer_followed_teams enable row level security;

create policy "Users can view own soccer teams"
  on soccer_followed_teams for select
  using (auth.uid() = user_id);

create policy "Users can insert own soccer teams"
  on soccer_followed_teams for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own soccer teams"
  on soccer_followed_teams for delete
  using (auth.uid() = user_id);


-- ── soccer_followed_players ──────────────────────────────────
-- Note: team_id is required to fetch fixtures for the player's team.
create table if not exists soccer_followed_players (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  player_id    integer not null,
  player_name  text not null,
  team_name    text not null default '',
  team_id      integer,
  created_at   timestamptz not null default now()
);

alter table soccer_followed_players enable row level security;

create policy "Users can view own soccer players"
  on soccer_followed_players for select
  using (auth.uid() = user_id);

create policy "Users can insert own soccer players"
  on soccer_followed_players for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own soccer players"
  on soccer_followed_players for delete
  using (auth.uid() = user_id);


-- ── recipes ──────────────────────────────────────────────────
create table if not exists recipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  ingredients  jsonb not null default '[]',
  instructions text not null default '',
  tags         text[] not null default '{}',
  servings     integer,
  cook_time    text,
  source_url   text,
  image_url    text,
  created_at   timestamptz not null default now()
);

alter table recipes enable row level security;

create policy "Users can view own recipes"
  on recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recipes"
  on recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete own recipes"
  on recipes for delete
  using (auth.uid() = user_id);


-- ── stocks_holdings ──────────────────────────────────────────
create table if not exists stocks_holdings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ticker        text not null,
  company_name  text not null,
  shares        numeric not null,
  avg_cost      numeric not null,
  created_at    timestamptz not null default now()
);

alter table stocks_holdings enable row level security;

create policy "Users can view own holdings"
  on stocks_holdings for select
  using (auth.uid() = user_id);

create policy "Users can insert own holdings"
  on stocks_holdings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on stocks_holdings for update
  using (auth.uid() = user_id);

create policy "Users can delete own holdings"
  on stocks_holdings for delete
  using (auth.uid() = user_id);


-- ── event_categories ─────────────────────────────────
-- User-managed buckets for calendar events (School, Mead, Personal, ...).
-- Categories own the color; events inherit it.
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

create policy "Users can view own event categories"
  on event_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own event categories"
  on event_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own event categories"
  on event_categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own event categories"
  on event_categories for delete
  using (auth.uid() = user_id);


-- ── calendar_events ─────────────────────────────────
create table if not exists calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  date        date not null,
  end_date    date,
  start_time  time,
  end_time    time,
  location    text,
  color       text not null default 'blue',
  category_id uuid references event_categories(id) on delete set null,
  course      text,
  completed   boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists calendar_events_category_idx
  on calendar_events (user_id, category_id);

alter table calendar_events enable row level security;

create policy "Users can view own events"
  on calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own events"
  on calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own events"
  on calendar_events for delete
  using (auth.uid() = user_id);


-- ── mead_batches ─────────────────────────────────────────────
-- One row per batch. Recipe + outcome live here; everything that
-- happens over time lives in the three child tables below.
-- ABV, attenuation, and the sweetness bucket are derived from
-- og/fg in src/tabs/mead/utils/calc.js, never stored.
create table if not exists mead_batches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  batch_number        integer,
  style               text not null default 'traditional',
  status              text not null default 'planning',
  vessel              text,
  image_url           text,
  source_url          text,
  tags                text[] not null default '{}',
  sweetness           text,
  carbonation         text default 'still',
  batch_size_gal      numeric,
  honey_varietal      text,
  honey_source        text,
  honey_lbs           numeric,
  honey_cost          numeric,
  water_gal           numeric,
  adjuncts            jsonb not null default '[]',
  yeast_strain        text,
  yeast_nitrogen_need text default 'medium',
  target_og           numeric,
  target_abv          numeric,
  og                  numeric,
  fg                  numeric,
  brew_date           date,
  pitch_date          date,
  bottled_date        date,
  drink_by_date       date,
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

create policy "Users can view own mead_batches"
  on mead_batches for select
  using (auth.uid() = user_id);

create policy "Users can insert own mead_batches"
  on mead_batches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mead_batches"
  on mead_batches for update
  using (auth.uid() = user_id);

create policy "Users can delete own mead_batches"
  on mead_batches for delete
  using (auth.uid() = user_id);


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

create policy "Users can view own mead_readings"
  on mead_readings for select
  using (auth.uid() = user_id);

create policy "Users can insert own mead_readings"
  on mead_readings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mead_readings"
  on mead_readings for update
  using (auth.uid() = user_id);

create policy "Users can delete own mead_readings"
  on mead_readings for delete
  using (auth.uid() = user_id);


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

create policy "Users can view own mead_additions"
  on mead_additions for select
  using (auth.uid() = user_id);

create policy "Users can insert own mead_additions"
  on mead_additions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mead_additions"
  on mead_additions for update
  using (auth.uid() = user_id);

create policy "Users can delete own mead_additions"
  on mead_additions for delete
  using (auth.uid() = user_id);


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

create policy "Users can view own mead_events"
  on mead_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own mead_events"
  on mead_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mead_events"
  on mead_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own mead_events"
  on mead_events for delete
  using (auth.uid() = user_id);
