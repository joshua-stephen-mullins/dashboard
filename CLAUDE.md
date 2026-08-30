# CLAUDE.md — Dashboard Project Instructions

## What This App Is
Dashboard is a personal dashboard SPA built for a single user. It aggregates everything the user cares about into one place: soccer fixtures, recipes, a stock portfolio, a calendar, a personal library, a wardrobe inventory, a D&D miniature collection, and a mead brewing log. It is private, login-protected, and designed to be easily extended with new tabs over time.

---

## Stack
- **Framework**: React + Vite
- **Styling**: CSS Modules (no Tailwind, no inline styles, no styled-components)
- **Data Fetching**: React Query + Context API
- **Backend**: Supabase (database, auth, file storage)
- **Soccer Data**: API-Football
- **Stock Data**: Finnhub (primary), Alpha Vantage (403 fallback for mutual funds), Supabase Edge Function `tsp-quote` (TSP funds)
- **Recipe URL Parsing**: Supabase Edge Functions
- **Book ISBN Lookup**: Supabase Edge Function `lookup-book` (Open Library)
- **MCP Server**: Cloudflare Workers + MCP SDK (assistant access to dashboard data)

---

## Core Principles
- **Tabs are isolated modules.** Each tab lives in `src/tabs/<tabname>/` and owns its own components, hooks, and styles. Nothing from one tab should import from another tab.
- **Shared code lives in shared folders.** Anything used across tabs goes in `src/components/`, `src/hooks/`, `src/lib/`, or `src/styles/`.
- **CSS Modules only.** Every component has its own `.module.css` file. Never use inline styles. Never use global class names inside components.
- **No public signup.** There is only one user. The app has a login page but no registration flow. The account is created directly in Supabase dashboard.
- **Never commit `.env`.** All API keys and secrets live in `.env` locally and are set as environment variables in the deployment platform.
- **Privacy mode on Stocks.** The stocks tab has a toggle that hides all financial values. Always respect this state when rendering any monetary or share count data.

### Collection Tabs
The following tabs share a common structural pattern and should be treated consistently when adding new ones:

**Collection tabs** (Recipes, Books, Clothes, Miniatures): photo-based catalogs of personally owned items. They share these conventions:

- Image upload follows the recipes pattern: file upload OR URL paste, with file upload taking priority. The Clothes tab is an exception — file upload only, no URL paste, since photos are user-taken.
- Each collection tab gets its own Supabase Storage bucket named `<collection>-images` (or `book-covers` for books).
- Each collection tab gets its own MCP tool file at `mcp/src/tools/<tabname>.ts` with at minimum: list, get, add, update, delete tools.
- Filter dropdowns populated from existing data (e.g. faction, storage location) update reactively as the user adds or edits items.

When adding a new collection tab in the future, follow this pattern. The Recipes tab is the canonical reference for image handling; the Books tab is the canonical reference for tabs with both a grid and a table view.

---

## Project Structure
See `docs/ARCHITECTURE.md` for full folder structure and naming conventions.

## Database
See `docs/DATABASE.md` for full Supabase schema and row-level security notes.

## Auth
See `docs/AUTH.md` for how authentication works and how to protect routes.

## External APIs
See `docs/APIS.md` for API-Football and Finnhub setup and usage.

## Tab Features
See `docs/TABS.md` for detailed feature specs for each tab.

## Styling Conventions
See `docs/STYLING.md` for CSS Modules conventions, design tokens, and global styles.

## Testing
See `docs/TESTING.md` for testing setup, what to test, and examples.

## MCP Server
See `docs/MCP.md` for the Cloudflare Workers MCP server — tools exposed, auth model, deployment, and how to register with Claude Code and Claude.ai.

---

## Current Status
- [x] Project scaffolded
- [x] Supabase project created
- [x] Auth implemented
- [ ] Soccer tab
- [ ] Recipes tab
- [ ] Stocks tab
- [ ] Calendar tab
- [ ] Books tab
- [ ] Clothes tab
- [ ] Miniatures tab
- [x] Mead tab
- [ ] Deployment
- [ ] MCP server (Cloudflare Workers)

---

## Things to Never Do
- Never add a signup/registration page or flow
- Never use inline styles
- Never import from one tab into another
- Never commit `.env` or any API keys
- Never store API keys in frontend code — use environment variables
- Never skip the privacy mode check when rendering stock values
- Never add Google Calendar sync — that is planned for a future phase
- Never expose `MCP_AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `USER_ID` in `mcp/` source code — all must live in Cloudflare environment variables only
- When adding a new tab, always add a corresponding tool file in `mcp/src/tools/` and register it in `mcp/src/index.ts`, then redeploy the Worker
- Never skip the wear-tracking update on the Clothes tab — when "log wear" is invoked, both `wear_count` and `last_worn` must be updated together
- Never store live external image URLs (Open Library covers) without persisting them — once a book is added, the `cover_url` is the user's record and should not be re-fetched on each render
- Never upload clothing images without client-side resizing — the 800px max dimension / 80% JPEG quality rule keeps Supabase Storage usage manageable
- Never query Open Library directly from frontend code — always go through the `lookup-book` edge function
- Never hardcode a calendar category — categories are user-managed rows in `event_categories`, and the coursework fields (`course`, `completed`) are driven by the category's `is_coursework` flag, never by a category's name
- Never set a categorized event's color independently — a categorized event's color comes from its category
- Never store a mead batch's ABV, attenuation, or sweetness bucket — they are derived from `og`/`fg` in `src/tabs/mead/utils/calc.js` and would drift the moment a gravity reading is corrected
- Never mark a TOSNA dose complete by deleting it or by any field other than `added_at` — a dose with `scheduled_at` set and `added_at` null is a planned dose, and that distinction is what drives the "due" state
- Never change the TOSNA formula or its yeast factors (low 0.75 / medium 0.90 / high 1.25) in one place only — `src/tabs/mead/utils/tosna.js` and `mcp/src/tools/mead.ts` implement it twice and must agree
