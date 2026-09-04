# TABS.md — Dashboard

## ⚽ Soccer Tab

### Purpose
Show the user upcoming soccer fixtures for the next 7 days, filtered to teams and players they follow.

### Features
- View upcoming fixtures for followed teams (next 7 days)
- View upcoming fixtures for followed players (pulls fixtures for the player's team)
- Follow / unfollow teams independently
- Follow / unfollow players independently
- Fixtures deduplicated if a followed player and followed team share the same team
- Fixtures grouped or sorted by date

### What a Fixture Card Shows
- Home team name + logo
- Away team name + logo
- League name
- Date and kick-off time (displayed in user's local timezone)
- Match status (upcoming, live, finished)

### What Is NOT in Scope
- Player stats (goals, assists, form)
- Live score updates (fixtures are cached for 10 minutes)
- League tables or standings

### Data Flow
1. On tab load, fetch `soccer_followed_teams` and `soccer_followed_players` from Supabase
2. Collect all unique team IDs (from followed teams + players' teams)
3. For each team ID, call API-Football `/fixtures?team={id}&next=7`
4. Deduplicate and sort by date
5. Render fixture cards

---

## 🍳 Recipes Tab

### Purpose
A personal recipe book. The user can manually add recipes or import them from a URL.

### Features
- Browse all saved recipes
- Search recipes by name
- Filter recipes by tag
- Add a recipe manually (form)
- Import a recipe from a URL (calls Supabase Edge Function `parse-recipe`)
- Edit an existing recipe
- Delete a recipe
- Each recipe has one optional image (device upload or URL paste)

### Recipe Form Fields
- Name (required)
- Ingredients (required) — structured list with quantity, unit, ingredient name
- Instructions (required) — step by step, plain text or numbered
- Tags — free-form, comma separated (e.g. "italian, pasta, quick")
- Servings
- Cook time
- Image — file upload OR URL paste (upload takes priority if both provided)
- Source URL — auto-filled if imported, optional if manual

### Import Flow
1. User pastes a URL and clicks "Import"
2. Frontend calls Supabase Edge Function `parse-recipe` with the URL
3. Edge function returns parsed recipe data
4. User sees a pre-filled form they can review and edit
5. User saves — recipe stored in Supabase

### Recipe Card (browse view) Shows
- Recipe image (or placeholder if none)
- Name
- Cook time
- Servings
- Tags

---

## 📈 Stocks Tab

### Purpose
Track the user's personal stock portfolio with live prices.

### Features
- View all holdings with live prices
- Add a holding (ticker, shares, average cost)
- Edit a holding (update shares or average cost)
- Delete a holding
- Portfolio summary: total value, day change ($ and %), number of positions
- **Privacy mode toggle** — a switch at the top of the tab that hides all sensitive financial data

### Privacy Mode
When privacy mode is ON, the following are hidden/replaced with `••••`:
- Total portfolio value
- Day change ($ amount and % )
- Per-holding: value, P/L ($ and %), average cost, number of shares

When privacy mode is ON, the following remain visible:
- Ticker symbols
- Company names
- Current price per share

Privacy mode state is stored in React local state (not persisted — resets on page reload).

### Holdings Table Columns
| Column | Hidden in Privacy Mode |
|---|---|
| Ticker | No |
| Company Name | No |
| Current Price | No |
| Shares | Yes |
| Avg Cost | Yes |
| Total Value | Yes |
| P/L ($) | Yes |
| P/L (%) | Yes |

### Data Flow
1. On tab load, fetch `stocks_holdings` from Supabase
2. Tickers are routed to one of three pricing sources (see `useStockQuotes`):
   - **`TSP-` tickers** → single `tsp-quote` Supabase edge function call (covers all TSP funds at once, 4hr stale)
   - **All other tickers** → Finnhub `/quote` (1min stale, refetch on window focus)
   - **Finnhub 403** → Alpha Vantage `GLOBAL_QUOTE` fallback (4hr stale, no window-focus refetch)
3. All sources normalise to `{ c, d, dp }` (current price, day change $, day change %)
4. Calculate total value, P/L, day change on the frontend
5. Never store live prices or P/L in the database

### TSP Ticker Convention
TSP (Thrift Savings Plan) funds use a custom `TSP-` prefix ticker format stored in `stocks_holdings`:
| Ticker | Fund |
|---|---|
| `TSP-G` | G Fund (Government Securities) |
| `TSP-F` | F Fund (Fixed Income Index) |
| `TSP-C` | C Fund (Common Stock Index) |
| `TSP-S` | S Fund (Small Cap Stock Index) |
| `TSP-I` | I Fund (International Stock Index) |
| `TSP-LINCOME` | L Income Fund |
| `TSP-L2025` … `TSP-L2075` | L Lifecycle Funds |

`shares` stores the actual TSP unit count. `avg_cost` stores the cost basis per unit (opening balance ÷ units).

### Add Holding Flow
1. User enters ticker symbol
2. **If `TSP-` prefix**: company name is resolved locally from `TSP_FUND_NAMES` in `src/lib/tsp.js` — no API call
3. **Otherwise**: app calls Finnhub `/stock/profile2` to auto-fill company name; falls back to Alpha Vantage `OVERVIEW` on 403
4. User enters number of shares and average cost
5. Saved to `stocks_holdings` in Supabase

---

## 📅 Calendar Tab

### Purpose
A personal event calendar for tracking deadlines, appointments, coursework, and anything else, organized into user-defined categories.

### Features
- Monthly calendar view
- Add / edit / delete events
- Click a day to add an event for that date
- User-managed categories (School, Mead, Personal, …) — see below
- Filter the month and sidebar by category
- Upcoming events sidebar (next 5 events from today)
- Assignments sidebar section for open coursework, overdue first
- Color-coded events

### Categories
Categories live in the `event_categories` table and are managed from the tab
("Manage categories" on the filter bar). They are the organizing unit for the calendar.

- Each category has a name, a color, and an `is_coursework` flag
- A categorized event takes its **category's** color; uncategorized events keep their own
- The filter bar shows one chip per category plus an Uncategorized chip when relevant,
  with per-category event counts. No chips selected means "show everything";
  selecting several chips shows the union.
- Deleting a category keeps its events — they become uncategorized (`on delete set null`)

### Coursework Categories
When a category has `is_coursework` set, events filed under it get two extra fields
in the event form: **Course** (e.g. "CS 401") and **Completed**.

- There is no separate "due date" — the event's own date is the due date
- Completed assignments render dimmed and struck through on the grid
- The Assignments sidebar section lists incomplete coursework, overdue first, then
  soonest first, with a checkbox to mark one done without opening the modal
- Overdue is measured against `end_date` when the event spans days, otherwise `date`

### Event Fields
- Title (required)
- Start date (required)
- End date (optional — if set, the event spans days)
- Start time (optional)
- End time (optional)
- Category (optional — defaults to Uncategorized)
- Course (only shown for coursework categories)
- Completed (only shown for coursework categories)
- Location (optional)
- Color (only shown when uncategorized — otherwise inherited from the category)
- Notes (optional)

### Calendar View
- Full monthly grid, weeks starting Monday
- Multi-day events render as spanning bars, stacked into tracks
- Today is visually highlighted
- Navigate forward/backward by month
- Clicking a day opens the add event modal pre-filled with that date

### Upcoming Events Sidebar
- Assignments section (when open coursework exists): title, due date, course, done checkbox
- Upcoming section: next 5 events from today — color bar, title, date/time, course, location
- Clicking an event opens the edit modal

### Out of Scope (for now)
- Google Calendar sync — planned for a future phase
- Week or day view
- Recurring events
- Mead brewing batches — planned as its own tab, not calendar events

---

## 📚 Books Tab

### Purpose
A personal library catalog. Track books the user owns, what they're currently reading, what they've finished, and what's been lent out.

### Features
- Browse all books in a cover-first grid view
- Toggle to a denser sortable table view
- Search books by title or author
- Filter books by genre, status, or rating
- Add a book manually (form)
- Import a book by ISBN (calls Supabase Edge Function `lookup-book`)
- Edit an existing book
- Delete a book
- Track reading status: unread, reading, read, dnf, lent out

### Book Form Fields
- Title (required)
- Author (required)
- ISBN (optional — used for lookup and dedup)
- Cover image — auto-filled from ISBN lookup, or paste URL, or upload file
- Genre — free-form, comma separated (e.g. "fantasy, epic, series")
- Page count (optional)
- Status (required) — one of: `unread`, `reading`, `read`, `dnf`, `lent_out`
- Rating (optional, 1–5)
- Date started (optional, auto-filled when status changes to `reading`)
- Date finished (optional, auto-filled when status changes to `read`)
- Lent to (optional, only relevant when status is `lent_out`)
- Notes (optional)
- Source URL (optional, auto-filled if imported)

### Import Flow (ISBN Lookup)
1. User enters an ISBN in the import field and clicks "Look up"
2. Frontend calls Supabase Edge Function `lookup-book` with the ISBN
3. Edge function returns `{ title, author, cover_url, page_count }` from Open Library
4. User sees a pre-filled form they can review and edit
5. User saves — book stored in Supabase

### Image Handling
Same priority order as recipes:
- If the user uploads a file → upload to Supabase Storage bucket `book-covers` → store URL in `cover_url`
- If the user pastes a URL (or it's auto-filled from Open Library) → store directly in `cover_url`
- If both → uploaded file takes priority
- If neither → `cover_url` is null, card shows a placeholder

### Grid View (default)
Each card shows:
- Cover image (or placeholder if none)
- Title
- Author
- Status badge (color-coded)
- Rating (if set, as star count)

### Table View
Sortable columns:
- Title
- Author
- Genre
- Status
- Rating
- Date finished
- Page count

User can toggle between grid and table view via a control at the top of the tab. View preference is local component state, not persisted.

### Status Workflow
- When status changes from anything to `reading` → `date_started` auto-fills to today (only if currently null)
- When status changes from anything to `read` → `date_finished` auto-fills to today (only if currently null)
- When status changes away from `lent_out` → `lent_to` is cleared

### What Is NOT in Scope
- Reading progress tracking (current page)
- Reading streaks or analytics
- Public/shared lists
- Goodreads sync

---

## 👕 Clothes Tab

### Purpose
A visual wardrobe inventory. Track what the user owns, what gets worn most, and what sits unused.

### Features
- Browse all clothing items in a photo grid
- Filter by category (top, bottom, outerwear, shoes, accessory, other)
- Filter by color
- Filter by season
- Filter by status (active, archived, donated, needs repair)
- Search by name
- Add an item (photo required)
- Edit an item
- Delete an item
- **Wear tracking** — tap an item to log a wear (increments `wear_count`, updates `last_worn`)
- View "least worn" and "most worn" sorts

### Clothing Form Fields
- Name (required) — user-defined label e.g. "navy oxford shirt"
- Category (required) — one of: `top`, `bottom`, `outerwear`, `shoes`, `accessory`, `other`
- Subcategory (optional, free text) — e.g. "t-shirt", "jeans", "sneakers"
- Color (required) — primary color for filtering
- Brand (optional)
- Size (optional)
- Season (optional, multi-select) — `spring`, `summer`, `fall`, `winter`
- Image (required) — file upload
- Status (required) — one of: `active`, `archived`, `donated`, `needs_repair`
- Date acquired (optional)
- Notes (optional)

### Image Handling
Photo is **required** for clothing items — the entire UX assumes visual recognition.
- File upload → Supabase Storage bucket `clothes-images` → URL stored in `image_url`
- Client-side resize before upload: max 800px on longest dimension, 80% JPEG quality, to keep storage usage manageable

### Card View
Each card shows:
- Photo (large, the main visual element)
- Name (small label below)
- Category badge
- Wear count (subtle, e.g. "worn 12×")
- Tap-to-log-wear button (or tap anywhere on the card to log wear from the grid)

### Sort Options
- Recently added (default)
- Most worn
- Least worn
- Recently worn
- Never worn

### Wear Tracking Behavior
- A "Log wear" action on the card and detail modal
- On log: `wear_count` increments by 1, `last_worn` is set to today
- No undo from the UI (intentionally simple — edit the item directly if needed)
- Wear count and last worn are visible on the card and in the detail view

### What Is NOT in Scope
- Outfit building / saved combinations
- Calendar of what was worn when
- Weather-based recommendations
- Auto-tagging via image analysis

---

## ⚔️ Miniatures Tab

### Purpose
A photo catalog of the user's D&D miniature collection. Track what they own, where it's stored, and what it's used for.

### Features
- Browse all miniatures in a photo grid
- Filter by faction
- Filter by storage location
- Search by name
- Add a miniature (manual entry)
- Edit a miniature
- Delete a miniature

### Miniature Form Fields
- Name (required) — e.g. "Mind Flayer", "Drizzt Do'Urden"
- Faction (optional, free text with autocomplete from existing values) — e.g. "Cult of the Dragon", "Drow", "Player Character"
- Unit type (optional, free text) — e.g. "monster", "character", "NPC"
- Quantity (default 1) — for cases with multiples of the same mini
- Image — file upload OR URL paste
- Storage location (optional, free text with autocomplete from existing values) — e.g. "Foam case A", "Shelf 2", "Box 3"
- Date acquired (optional)
- Notes (optional)

### Image Handling
Same priority order as recipes:
- If the user uploads a file → upload to Supabase Storage bucket `miniature-images` → store URL in `image_url`
- If the user pastes a URL → store directly in `image_url`
- If both → uploaded file takes priority
- If neither → `image_url` is null, card shows a placeholder

### Card View
Each card shows:
- Photo (or placeholder if none)
- Name
- Faction (if set)
- Storage location (if set, subtle)
- Quantity badge (only displayed if quantity > 1)

### Filter Behavior
- Faction filter dropdown is populated from distinct values currently in the user's collection
- Storage location filter dropdown is populated the same way
- Both filters update reactively as the user adds/edits miniatures

### What Is NOT in Scope
- Painted/unpainted status tracking
- Painting progress workflows
- Color scheme or paint recipe notes
- Game system field (D&D only)

---

# Mead Tab

## Purpose
A brewing log for the user's own mead batches — not a recipe collection. Each batch is a record that accumulates readings over weeks or months, so the tab is built around a parent batch plus three time-series children rather than a single flat row.

## Data Model
One `mead_batches` row per batch, plus `mead_readings`, `mead_additions`, and `mead_events` hanging off it (all `on delete cascade`). See `docs/DATABASE.md`.

## Derived Values
Nothing computed is ever stored. `src/tabs/mead/utils/calc.js` owns:
- **ABV** — `(OG − FG) × 131.25`, the standard homebrew approximation
- **Apparent attenuation** — `(OG − FG) / (OG − 1)`
- **Sweetness bucket** — dry `< 1.010`, semi-sweet `1.010–1.025`, sweet `> 1.025`
- **BJCP strength class** — hydromel `< 7.5%`, standard `7.5–14%`, sack `≥ 14%`
- **Brix ↔ SG** — the standard cubic approximation
- **1/3 sugar break** — `OG − (OG − 1) / 3`, the trigger for the final nutrient dose

## TOSNA 3.0 Nutrient Calculator
`src/tabs/mead/utils/tosna.js` implements Tailored Organic Staggered Nutrient Addition:

```
total Fermaid-O (g) = (Brix × 10 × gallons × yeastFactor) / 50
yeastFactor: low 0.75 · medium 0.90 · high 1.25
```

Split into four equal doses at **24h, 48h, 72h after pitch**, and at the **1/3 sugar break or day 7, whichever comes first**. Saving the schedule writes four `mead_additions` rows with `scheduled_at` set and `added_at` null; a dose is complete only when `added_at` is filled in. The fourth dose also stores its trigger gravity in `gravity_at_addition`, so it can fire on gravity rather than only on the calendar.

## Fermentation Chart
Hand-rolled SVG in `components/FermentationChart` — the project has no charting dependency and three series over a handful of points does not warrant one. Gravity, temperature, and pH sit on incompatible scales, so each series is normalised against its own min/max and the legend carries its real range. Series can be toggled off.

## Editing readings
The readings table has an edit (✎) and a delete (✕) per row. Editing loads the row back into the log form and preserves its original `recorded_at` — a correction records when the reading was taken, not when the mistake was noticed. `update_mead_reading` and `delete_mead_reading` do the same over MCP.

Every row delete — readings, nutrient doses, additions, and events — routes through a `ConfirmModal` naming the entry. The rows are dense and the edit button sits beside the delete, so a misclick is easy and the log it destroys cannot be reconstructed.

## Degassing
Degassing is recorded as a `degas` row in `mead_events`, not as a flag on a reading. An earlier `degassed` boolean on the readings form was removed: in practice the whole batch is degassed and then sampled, so the two recorded the same act in two places, and the flag was easy to tick backwards. The `degassed` column remains on `mead_readings` for the rows that already carry it, but nothing writes it.

## Bottle Inventory
`bottle_count` is set at packaging; `bottles_remaining` decrements as bottles are drunk or gifted, from the UI or the `drink_mead_bottle` MCP tool. Rendered as one pip per bottle rather than a progress bar, because a bar's width would require an inline style.

## Image Handling
Follows the recipes pattern — file upload OR URL paste, upload wins. Bucket: `mead-images`.

## What Is NOT in Scope
- Recipe scaling or a recipe designer
- Water chemistry / mineral additions
- Competition scoresheet tracking
- Sharing batches with other users
