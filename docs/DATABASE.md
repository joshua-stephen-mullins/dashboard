# DATABASE.md — Dashboard

## Platform
Supabase (hosted Postgres). All tables use UUID primary keys and include `created_at` timestamps. Row-Level Security (RLS) is enabled on every table so users can only access their own data.

`supabase/schema.sql` is the full schema — paste it into the SQL Editor for a fresh project.
Incremental changes to an existing database live in `supabase/migrations/`, newest last.

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
| color | text | Color key: "blue", "green", "amber", "red", "teal", "purple", "orange", "pink". Only used when `category_id` is null — otherwise the category's color wins |
| category_id | uuid | Nullable — foreign key → event_categories. `on delete set null`, so deleting a category keeps its events |
| course | text | Nullable — only meaningful for events in a coursework category (e.g. "CS 401") |
| completed | boolean | Default false — only meaningful for events in a coursework category |
| notes | text | Nullable — optional notes |
| created_at | timestamp | Auto-generated |

---

### event_categories
User-managed buckets for calendar events (School, Mead, Personal, …). Categories own the color; events inherit it.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| name | text | Category name — unique per user |
| color | text | Color key, same set as `calendar_events.color` |
| is_coursework | boolean | Default false — when true, events in this category get `course` and `completed` fields in the UI |
| sort_order | integer | Default 0 — controls chip/dropdown order |
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
| status | text | One of: `unread`, `reading`, `read`, `dnf`, `lent_out` |
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

Apply these policies to `books`, `clothes`, `miniatures`, and `event_categories` along with all existing tables.

---

## Supabase Storage

| Bucket | Access | Used By |
|---|---|---|
| `recipe-images` | Public read, authenticated write | Recipes tab — uploaded recipe images |
| `book-covers` | Public read, authenticated write | Books tab — uploaded book covers |
| `clothes-images` | Public read, authenticated write | Clothes tab — required item photos |
| `miniature-images` | Public read, authenticated write | Miniatures tab — miniature photos |

All buckets follow the same access policy: anyone can read (so URLs can render), but only authenticated users can upload. Images are uploaded from their respective tabs when the user provides a file, and the resulting public URL is stored in the corresponding image column.

---

### mead_batches
One row per mead batch. Recipe and outcome live here; everything that happens over time lives in the three child tables below.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | Foreign key → auth.users |
| name | text | e.g. "Blackberry Melomel #3" |
| batch_number | integer | Nullable — the user's own numbering |
| style | text | `traditional` \| `melomel` \| `cyser` \| `pyment` \| `metheglin` \| `braggot` \| `other` |
| status | text | `planning` \| `primary` \| `secondary` \| `bulk_aging` \| `bottled` \| `drinking` \| `archived` |
| vessel | text | Nullable — e.g. "1 gal carboy" |
| image_url | text | Nullable — Supabase Storage URL or external URL |
| source_url | text | Nullable — recipe source |
| tags | text[] | Array of tag strings |
| sweetness | text | Nullable — declared target; the *actual* bucket is derived from `fg` |
| carbonation | text | `still` \| `petillant` \| `sparkling` |
| batch_size_gal | numeric | Gallons — drives the TOSNA dose |
| honey_varietal | text | e.g. "orange blossom" |
| honey_source | text | Apiary or store |
| honey_lbs | numeric | Weight, not volume |
| honey_cost | numeric | USD, used for cost per bottle |
| water_gal | numeric | Nullable |
| adjuncts | jsonb | Array of `{name, amount, unit, stage}` for fruit, spice, grain |
| yeast_strain | text | e.g. "Lalvin D47" |
| yeast_nitrogen_need | text | `low` \| `medium` \| `high` — the TOSNA yeast factor (0.75 / 0.90 / 1.25) |
| target_og / target_abv | numeric | Planning values |
| og / fg | numeric | Measured original and final gravity |
| brew_date / pitch_date / bottled_date / drink_by_date | date | Nullable |
| bottle_count | integer | Bottles filled at packaging |
| bottles_remaining | integer | Decremented as bottles are drunk |
| bottle_size | text | e.g. "750 ml" |
| carbonation_method | text | still / priming sugar / forced |
| rating | integer | 1–5 |
| tasting_notes / notes | text | Nullable |
| created_at | timestamp | Auto-generated |

**Derived, never stored:** ABV `(og − fg) × 131.25`, apparent attenuation, the sweetness bucket, the BJCP strength class, Brix conversions, and the TOSNA schedule. All live in `src/tabs/mead/utils/` so they cannot drift from the gravity readings they come from.

#### Image Handling
Follows the recipes pattern — file upload OR URL paste, upload wins. Bucket: `mead-images`.

---

### mead_readings
Fermentation time series. One row per hydrometer / thermometer / pH check.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key → auth.users |
| batch_id | uuid | Foreign key → mead_batches, `on delete cascade` |
| recorded_at | timestamptz | When the reading was taken |
| gravity | numeric | Specific gravity |
| temperature_f | numeric | Fahrenheit |
| ph | numeric | Must pH — below 3.0 stalls fermentation |
| degassed | boolean | Whether the batch was degassed at this check |
| notes | text | Nullable |
| created_at | timestamp | Auto-generated |

---

### mead_additions
Anything put into the must after pitch. TOSNA doses are written here with `scheduled_at` set and `added_at` null until the dose is actually given.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key → auth.users |
| batch_id | uuid | Foreign key → mead_batches, `on delete cascade` |
| category | text | `nutrient` \| `fruit` \| `spice` \| `oak` \| `acid` \| `stabilizer` \| `honey` \| `other` |
| product | text | e.g. "Fermaid-O", "potassium sorbate" |
| amount | numeric | Nullable |
| unit | text | Default `g` |
| dose_number | integer | 1–4 for a TOSNA schedule, null otherwise |
| scheduled_at | timestamptz | When the dose is planned |
| added_at | timestamptz | Null until given — this is what marks a dose complete |
| gravity_at_addition | numeric | For dose 4, the 1/3 sugar break that triggers it |
| notes | text | Nullable |
| created_at | timestamp | Auto-generated |

---

### mead_events
Process milestones — racking, degassing, stabilizing, backsweetening, fining, cold crashing, bottling.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key → auth.users |
| batch_id | uuid | Foreign key → mead_batches, `on delete cascade` |
| event_type | text | `rack` \| `degas` \| `stabilize` \| `backsweeten` \| `fining` \| `oak` \| `cold_crash` \| `bottle` \| `taste` \| `other` |
| occurred_at | timestamptz | When it happened |
| gravity | numeric | Nullable — gravity at the time |
| volume_lost | numeric | Nullable — e.g. gallons lost to racking |
| notes | text | Nullable |
| created_at | timestamp | Auto-generated |
