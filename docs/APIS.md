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

## Supabase Edge Functions

### Recipe URL Import
Used to parse recipe data from a URL the user provides.

- **Function name**: `parse-recipe`
- **Trigger**: User pastes a URL in the recipe import flow and clicks import
- **Input**: `{ url: string }`
- **Output**: `{ name, ingredients, instructions, cook_time, servings, image_url }`
- The edge function fetches the page server-side, parses structured recipe data (JSON-LD schema if available, otherwise best-effort HTML parsing), and returns a structured recipe object
- The user can review and edit the parsed data before saving

---

## Rate Limits
| API | Free Tier Limit | Notes |
|---|---|---|
| API-Football | 100 requests/day | Cache aggressively — 10 min stale time |
| Finnhub | 60 requests/minute | 1 min stale time, refetch on window focus |
| Alpha Vantage | 25 requests/day | Fallback only — 4 hr stale time, no window-focus refetch |
| Supabase | Generous free tier | No concerns for personal use |
