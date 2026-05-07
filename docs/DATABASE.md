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
| date | date | Event start date |
| end_date | date | Nullable — if set, event spans from `date` to `end_date` inclusive |
| start_time | time | Nullable — optional start time |
| end_time | time | Nullable — optional end time |
| location | text | Nullable — optional location |
| color | text | Color key: "blue", "green", "amber", "red", "teal", "purple", "orange", "pink" |
| notes | text | Nullable — optional notes |
| created_at | timestamp | Auto-generated |

---

### books
Stores the user's personal library catalog.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| title | text | Book title |
| author | text | Author name |
| isbn | text | Nullable — used for ISBN lookup and dedup |
| cover_url | text | Nullable — Supabase Storage URL or external URL (e.g. Open Library) |
| genre | text[] | Array of genre/tag strings |
| page_count | integer | Nullable |
| status | text | One of: `owned`, `reading`, `read`, `dnf`, `lent_out` |
| rating | integer | Nullable — 1 to 5 |
| date_started | date | Nullable — auto-filled when status changes to `reading` |
| date_finished | date | Nullable — auto-filled when status changes to `read` |
| lent_to | text | Nullable — only relevant when status is `lent_out` |
| notes | text | Nullable |
| source_url | text | Nullable — auto-filled if imported via ISBN lookup |
| created_at | timestamp | Auto-generated |

#### Image Handling
- If the user uploads a cover image → upload to Supabase Storage bucket `book-covers` → store the resulting public URL in `cover_url`
- If the user pastes a URL or it's auto-filled from Open Library → store directly in `cover_url`
- If the user uploads a file and a URL is set → uploaded file takes priority
- If neither → `cover_url` is null

---

### clothes
Stores the user's wardrobe inventory.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| name | text | User-defined label e.g. "navy oxford shirt" |
| category | text | One of: `top`, `bottom`, `outerwear`, `shoes`, `accessory`, `other` |
| subcategory | text | Nullable — free text e.g. "t-shirt", "jeans" |
| color | text | Primary color for filtering |
| brand | text | Nullable |
| size | text | Nullable |
| season | text[] | Array — any of: `spring`, `summer`, `fall`, `winter` |
| image_url | text | Required — Supabase Storage URL |
| status | text | One of: `active`, `archived`, `donated`, `needs_repair` |
| wear_count | integer | Default 0 — increments on tap-to-log |
| last_worn | date | Nullable — set when wear is logged |
| date_acquired | date | Nullable |
| notes | text | Nullable |
| created_at | timestamp | Auto-generated |

#### Image Handling
- Image is **required** — the UX is photo-first
- File upload → Supabase Storage bucket `clothes-images` → URL stored in `image_url`
- Client-side resize before upload: max 800px on longest dimension, 80% JPEG quality
- No URL paste option for this tab

---

### miniatures
Stores the user's D&D miniature collection.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| name | text | Miniature name e.g. "Mind Flayer", "Drizzt Do'Urden" |
| faction | text | Nullable — e.g. "Cult of the Dragon", "Drow", "Player Character" |
| unit_type | text | Nullable — e.g. "monster", "character", "NPC" |
| quantity | integer | Default 1 — for multiples of the same mini |
| image_url | text | Nullable — Supabase Storage URL or external URL |
| storage_location | text | Nullable — e.g. "Foam case A", "Shelf 2", "Box 3" |
| date_acquired | date | Nullable |
| notes | text | Nullable |
| created_at | timestamp | Auto-generated |

#### Image Handling
- If the user uploads an image → upload to Supabase Storage bucket `miniature-images` → store the resulting public URL in `image_url`
- If the user pastes a URL → store directly in `image_url`
- If both → uploaded file takes priority
- If neither → `image_url` is null

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

Apply these policies to `books`, `clothes`, and `miniatures` along with all existing tables.

---

## Supabase Storage

| Bucket | Access | Used By |
|---|---|---|
| `recipe-images` | Public read, authenticated write | Recipes tab — uploaded recipe images |
| `book-covers` | Public read, authenticated write | Books tab — uploaded book covers |
| `clothes-images` | Public read, authenticated write | Clothes tab — required item photos |
| `miniature-images` | Public read, authenticated write | Miniatures tab — miniature photos |

All buckets follow the same access policy: anyone can read (so URLs can render), but only authenticated users can upload. Images are uploaded from their respective tabs when the user provides a file, and the resulting public URL is stored in the corresponding image column.
