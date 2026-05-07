# APIS.md — Dashboard

## Environment Variables
All API keys are stored in `.env` and accessed via `import.meta.env` in Vite. Never hardcode keys.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FOOTBALL_API_KEY=
VITE_FINNHUB_API_KEY=
VITE_ALPHA_VANTAGE_API_KEY=
```

A `.env.example` file with these keys (empty values) is committed to the repo so it's clear what variables are needed.

---

## API-Football

### About
Used to fetch upcoming soccer fixtures for teams and players the user follows.

### Base URL
```
https://v3.football.api-sports.io
```

### Auth
Pass the API key as a header on every request:
```
x-apisports-key: <VITE_FOOTBALL_API_KEY>
```

### Client
Located at `src/lib/football.js`. All API-Football requests go through this client — never call the API directly from a component.

### Endpoints Used

#### Get fixtures for a team (next 7 days)
```
GET /fixtures?team={teamId}&next=7
```
Returns upcoming fixtures for a given team within the next 7 days.

#### Get fixtures for a player's team
API-Football doesn't support querying fixtures directly by player. Instead:
1. When the user follows a player, also store their `team_id`
2. Fetch fixtures using the player's `team_id` the same way as a followed team
3. Deduplicate fixtures if a followed player and a followed team share the same team

#### Response Shape (fixture)
Key fields to extract and display:
```json
{
  "fixture": {
    "id": 123,
    "date": "2026-05-04T14:30:00+00:00",
    "status": { "short": "NS" }
  },
  "league": {
    "name": "Premier League",
    "logo": "https://..."
  },
  "teams": {
    "home": { "id": 42, "name": "Arsenal", "logo": "https://..." },
    "away": { "id": 49, "name": "Chelsea", "logo": "https://..." }
  },
  "goals": {
    "home": null,
    "away": null
  }
}
```

### Caching
React Query should cache fixture responses for **10 minutes** (`staleTime: 10 * 60 * 1000`). The soccer tab does not need real-time updates.

---

## Finnhub

### About
Used to fetch real-time stock prices for the user's portfolio holdings.

### Base URL
```
https://finnhub.io/api/v1
```

### Auth
Pass the API key as a query parameter:
```
?token=<VITE_FINNHUB_API_KEY>
```

### Client
Located at `src/lib/finnhub.js`. All Finnhub requests go through this client.

### Endpoints Used

#### Get real-time quote for a ticker
```
GET /quote?symbol={ticker}&token={key}
```

#### Response Shape
```json
{
  "c": 189.50,   // Current price
  "d": 2.30,     // Change (dollar)
  "dp": 1.23,    // Change (percent)
  "h": 191.00,   // High of day
  "l": 187.50,   // Low of day
  "o": 188.00,   // Open price
  "pc": 187.20   // Previous close
}
```

Key fields: `c` (current price), `d` (day change $), `dp` (day change %)

#### Get company profile (for company name)
```
GET /stock/profile2?symbol={ticker}&token={key}
```
Use this when the user adds a new holding to auto-fill the company name.

### Caching
React Query should cache quote responses for **1 minute** (`staleTime: 60 * 1000`). Prices refresh automatically on tab focus.

### Fallback behaviour
Finnhub's free tier does not support mutual funds or some other security types — these requests return a **403**. When a 403 is detected, the quote and company lookup automatically fall back to Alpha Vantage (see below). This is handled transparently in `useStockQuotes` and `HoldingFormModal`; the rest of the UI sees normalised data regardless of which API sourced it.

---

## Alpha Vantage

### About
Used as a **fallback only** for tickers that Finnhub rejects with a 403 (mutual funds, some ETFs). Not used for tickers that Finnhub supports.

### Base URL
```
https://www.alphavantage.co/query
```

### Auth
Pass the API key as a query parameter:
```
?apikey=<VITE_ALPHA_VANTAGE_API_KEY>
```

### Client
Located at `src/lib/alphaVantage.js`.

### Endpoints Used

#### Get quote for a ticker
```
GET /query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={key}
```

#### Response shape (key fields extracted)
```json
{
  "Global Quote": {
    "05. price": "14.23",
    "09. change": "0.12",
    "10. change percent": "0.85%"
  }
}
```

The client normalises this to `{ c, d, dp }` to match the Finnhub quote shape so the rest of the app doesn't need to know which API was used.

#### Get company profile (for company name)
```
GET /query?function=OVERVIEW&symbol={ticker}&apikey={key}
```
Returns `{ Name, ... }`. Used in `HoldingFormModal` when Finnhub's `/stock/profile2` returns a 403.

### Caching
Alpha Vantage fallback quotes are cached for **4 hours** (`staleTime: 4 * 60 * 60 * 1000`) with no window-focus refetch. Mutual fund NAV only updates once daily after market close, so 1-minute freshness is unnecessary and would exhaust the free tier limit quickly.

### Rate Limits (free tier)
**25 requests/day.** This is why Alpha Vantage is a targeted fallback rather than the primary API. With a 4-hour stale time, a handful of mutual fund holdings will comfortably stay within this limit.

---

## TSP Fund Pricing

### About
TSP (Thrift Savings Plan) funds are government retirement funds not available through Finnhub or Alpha Vantage. Pricing is handled by a dedicated Supabase edge function (`tsp-quote`) that fetches data from two public sources.

### Ticker Format
TSP funds use a custom `TSP-` prefix so the app can identify them and route pricing correctly. Examples: `TSP-C`, `TSP-S`, `TSP-L2050`, `TSP-LINCOME`. See the full map in `src/lib/tsp.js` (`TSP_FUND_NAMES`) and `supabase/functions/tsp-quote/index.ts` (`TICKER_TO_FUND`).

### Edge Function
- **Function name**: `tsp-quote`
- **Trigger**: Called via `supabase.functions.invoke('tsp-quote')` from `src/lib/tsp.js`
- **Output**: `{ 'TSP-C': { c, d, dp }, 'TSP-F': { c, d, dp }, ... }` — same normalised shape as Finnhub and Alpha Vantage

### Primary Data Source — dailytsp.com
```
GET https://api.dailytsp.com/close/
```
- Public endpoint, no auth required
- Returns all fund prices for the most recent trading day, keyed by date then fund name
- Example: `{ "2026-05-06": { "C Fund": 93.6957, "G Fund": 18.5491, ... } }`

### Previous-Day Prices — tsp.gov CSV
```
GET https://www.tsp.gov/data/fund-price-history.csv?startdate={YYYY-MM-DD}&enddate={YYYY-MM-DD}&Lfunds=1&InvFunds=1
```
- Used to calculate day change (`d`, `dp`) by comparing current price to the previous trading day
- The edge function fetches the last 7 days and picks the most recent date that isn't today
- If this endpoint is unavailable, `d` and `dp` default to `0`

### Client
Located at `src/lib/tsp.js`. `tspGetAllQuotes()` invokes the edge function and returns the full quotes map.

### Caching
React Query caches TSP quotes for **4 hours** (`staleTime: 4 * 60 * 60 * 1000`) with no window-focus refetch. TSP fund prices update once daily after market close, so more frequent fetching is unnecessary.

### Rate Limits
No documented rate limits on `api.dailytsp.com`. The edge function is invoked at most once per 4 hours per browser session (React Query cache), so usage is minimal.

---

## Supabase Edge Functions

### Recipe URL Import
Used to parse recipe data from a URL the user provides.

- **Function name**: `parse-recipe`
- **Trigger**: User pastes a URL in the recipe import flow and clicks import
- **Input**: `{ url: string }`
- **Output**: `{ name, ingredients, instructions, cook_time, servings, image_url }`
- The edge function fetches the page server-side, parses structured recipe data (JSON-LD schema if available, otherwise best-effort HTML parsing), and returns a structured recipe object
- The user can review and edit the parsed data before saving

### Book ISBN Lookup
Used to look up book metadata by ISBN when adding a book to the library.

- **Function name**: `lookup-book`
- **Trigger**: User enters an ISBN in the books import flow and clicks "Look up"
- **Input**: `{ isbn: string }`
- **Output**: `{ title, author, cover_url, page_count, source_url }`
- The edge function fetches from Open Library's Books API server-side, parses the response, and returns a structured book object
- The user can review and edit the parsed data before saving
- Also called by the MCP server's `lookup_book_by_isbn` tool

#### Open Library Endpoint
```
GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data
```

- Public endpoint, no API key required
- Returns title, authors array, cover image URLs (small/medium/large), page count, and the Open Library work URL
- The edge function picks the `medium` cover URL by default and falls back to `small` if `medium` is unavailable

#### Response Mapping
| Output Field | Source |
|---|---|
| `title` | `title` |
| `author` | First entry of `authors[].name`, comma-joined if multiple |
| `cover_url` | `cover.medium` (fallback to `cover.small`, null if neither) |
| `page_count` | `number_of_pages` (null if unavailable) |
| `source_url` | `url` (the Open Library work URL) |

#### Error Handling
- If the ISBN is not found in Open Library → return `{ error: 'not_found' }` with HTTP 404
- If the Open Library response is malformed → return `{ error: 'parse_failed' }` with HTTP 502
- The frontend should show a "Couldn't find that ISBN — add manually instead" message and let the user fill in the form by hand

#### Caching
Open Library responses are not cached at the edge function layer. Each lookup is a single user-initiated action with no rate-limit concerns at personal-use scale.

---

## MCP Server — Supabase Access

The MCP server (`mcp/`) accesses Supabase using the **service-role key**, not the anon key. This key bypasses all RLS policies and has full read/write access to the database.

**This key must never appear in source code.** It is stored exclusively as a Cloudflare Workers secret (`SUPABASE_SERVICE_ROLE_KEY`) and injected at runtime. The MCP server's own auth layer (bearer token check) is the only access control in front of it.

The MCP server does not use the frontend's Supabase client (`src/lib/supabase.js`). It initialises its own client using the service-role key inside the Worker.

---

## Rate Limits
| API | Free Tier Limit | Notes |
|---|---|---|
| API-Football | 100 requests/day | Cache aggressively — 10 min stale time |
| Finnhub | 60 requests/minute | 1 min stale time, refetch on window focus |
| Alpha Vantage | 25 requests/day | Fallback only — 4 hr stale time, no window-focus refetch |
| dailytsp.com | No documented limit | Proxied through edge function — 4 hr stale time |
| tsp.gov CSV | No documented limit | Used for previous-day prices only, one call per edge function invocation |
| Open Library | No documented limit | Used only for ISBN lookups via `lookup-book` edge function — typically a handful of calls per day |
| Supabase | Generous free tier | No concerns for personal use |
| Cloudflare Workers | 100,000 requests/day | Free tier — no concerns for personal assistant use |
