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
2. For each holding, call Finnhub `/quote?symbol={ticker}` for live price
3. Calculate total value, P/L, day change on the frontend
4. Never store live prices or P/L in the database

### Add Holding Flow
1. User enters ticker symbol
2. App calls Finnhub `/stock/profile2` to auto-fill company name
3. User enters number of shares and average cost
4. Saved to `stocks_holdings` in Supabase

---

## 📅 Calendar Tab

### Purpose
A personal event calendar for tracking deadlines, appointments, and anything else.

### Features
- Monthly calendar view
- Add events
- Edit events
- Delete events
- Click a day to add an event for that date
- Upcoming events sidebar (next 5 events from today)
- Color-coded events

### Event Fields
- Title (required)
- Date (required)
- Start time (optional)
- End time (optional — if omitted, treated as same-day single event)
- Location (optional)
- Color (required — choose from: blue, green, amber, red, teal)
- Notes (optional)

### Calendar View
- Full monthly grid
- Days with events show a colored dot per event
- Today is visually highlighted
- Navigate forward/backward by month
- Clicking a day opens the add event modal pre-filled with that date

### Upcoming Events Sidebar
- Shows next 5 events from today's date
- Each item shows: color bar, event title, date (and time if set), location if provided
- Clicking an event opens the edit modal

### Out of Scope (for now)
- Google Calendar sync — planned for a future phase
- Week or day view
- Recurring events
