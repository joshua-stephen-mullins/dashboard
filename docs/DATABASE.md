# DATABASE.md — Dashboard

## Platform
Supabase (hosted Postgres). All tables use UUID primary keys and include `created_at` timestamps. Row-Level Security (RLS) is enabled on every table so users can only access their own data.

---

## Tables

### soccer_followed_teams
Stores the teams the user has chosen to follow for fixture tracking.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| team_id | integer | ID from API-Football |
| team_name | text | Display name |
| league | text | e.g. "Premier League" |
| logo_url | text | Nullable — team crest URL from API-Football, stored at follow time |
| created_at | timestamp | Auto-generated |

---

### soccer_followed_players
Stores individual players the user wants to track independently of teams.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| player_id | integer | ID from API-Football |
| player_name | text | Display name |
| team_name | text | Current team display name |
| team_id | integer | Nullable — ID from API-Football; used to fetch fixtures for the player's team |
| photo_url | text | Nullable — player headshot URL from API-Football, stored at follow time |
| created_at | timestamp | Auto-generated |

---

### recipes
Stores the user's personal recipe collection.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| name | text | Recipe name |
| ingredients | jsonb | Array of ingredient objects |
| instructions | text | Step-by-step instructions |
| tags | text[] | Array of tag strings |
| servings | integer | Number of servings |
| cook_time | text | e.g. "30 min" |
| source_url | text | Nullable — URL if imported |
| image_url | text | Nullable — Supabase Storage URL or external URL |
| created_at | timestamp | Auto-generated |

#### Image Handling
- If the user uploads an image file → upload to Supabase Storage bucket `recipe-images` → store the resulting public URL in `image_url`
- If the user pastes an image URL → store it directly in `image_url`
- If the user uploads a file and pastes a URL → uploaded file takes priority
- If neither → `image_url` is null

---

### stocks_holdings
Stores the user's stock portfolio holdings.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| ticker | text | Stock ticker symbol e.g. "AAPL" |
| company_name | text | Full company name |
| shares | numeric | Number of shares owned |
| avg_cost | numeric | Average cost per share in USD |
| created_at | timestamp | Auto-generated |

Live prices and P/L are calculated on the frontend using Finnhub — they are never stored in the database.

---

### calendar_events
Stores the user's personal calendar events.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| title | text | Event name |
| date | date | Event date |
| start_time | time | Optional start time |
| end_time | time | Optional — defaults to same day if omitted |
| location | text | Nullable — optional location |
| color | text | Color key e.g. "blue", "red", "green", "amber", "teal" |
| notes | text | Nullable — optional notes |
| created_at | timestamp | Auto-generated |

---

## Row-Level Security
Every table has RLS enabled with the following policy pattern:

```sql
-- Users can only select their own rows
CREATE POLICY "Users can view own data" ON <table>
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "Users can insert own data" ON <table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "Users can update own data" ON <table>
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "Users can delete own data" ON <table>
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Supabase Storage
- **Bucket name**: `recipe-images`
- **Access**: Public read, authenticated write
- Images are uploaded from the recipes tab when the user provides a file
- The resulting public URL is stored in `recipes.image_url`
