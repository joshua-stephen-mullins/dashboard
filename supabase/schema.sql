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


-- ── calendar_events ──────────────────────────────────────────
create table if not exists calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  date        date not null,
  start_time  time,
  end_time    time,
  location    text,
  color       text not null default 'blue',
  notes       text,
  created_at  timestamptz not null default now()
);

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
