# CLAUDE.md — Dashboard Project Instructions

## What This App Is
Dashboard is a personal dashboard SPA built for a single user. It aggregates everything the user cares about into one place: soccer fixtures, recipes, a stock portfolio, and a calendar. It is private, login-protected, and designed to be easily extended with new tabs over time.

---

## Stack
- **Framework**: React + Vite
- **Styling**: CSS Modules (no Tailwind, no inline styles, no styled-components)
- **Data Fetching**: React Query + Context API
- **Backend**: Supabase (database, auth, file storage)
- **Soccer Data**: API-Football
- **Stock Data**: Finnhub
- **Recipe URL Parsing**: Supabase Edge Functions

---

## Core Principles
- **Tabs are isolated modules.** Each tab lives in `src/tabs/<tabname>/` and owns its own components, hooks, and styles. Nothing from one tab should import from another tab.
- **Shared code lives in shared folders.** Anything used across tabs goes in `src/components/`, `src/hooks/`, `src/lib/`, or `src/styles/`.
- **CSS Modules only.** Every component has its own `.module.css` file. Never use inline styles. Never use global class names inside components.
- **No public signup.** There is only one user. The app has a login page but no registration flow. The account is created directly in Supabase dashboard.
- **Never commit `.env`.** All API keys and secrets live in `.env` locally and are set as environment variables in the deployment platform.
- **Privacy mode on Stocks.** The stocks tab has a toggle that hides all financial values. Always respect this state when rendering any monetary or share count data.

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

---

## Current Status
- [ ] Project scaffolded
- [ ] Supabase project created
- [ ] Auth implemented
- [ ] Soccer tab
- [ ] Recipes tab
- [ ] Stocks tab
- [ ] Calendar tab
- [ ] Deployment

---

## Things to Never Do
- Never add a signup/registration page or flow
- Never use inline styles
- Never import from one tab into another
- Never commit `.env` or any API keys
- Never store API keys in frontend code — use environment variables
- Never skip the privacy mode check when rendering stock values
- Never add Google Calendar sync — that is planned for a future phase
