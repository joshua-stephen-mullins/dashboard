# APIS.md — Dashboard

## Environment Variables
All API keys are stored in `.env` and accessed via `import.meta.env` in Vite. Never hardcode keys.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FOOTBALL_API_KEY=
VITE_FINNHUB_API_KEY=
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
| Finnhub | 60 requests/minute | 1 min stale time, batch requests where possible |
| Supabase | Generous free tier | No concerns for personal use |
