# OVERVIEW.md — Dashboard

## What It Is
Dashboard is a private, single-user personal dashboard. It brings together the things the user cares about day-to-day — soccer fixtures, recipes, a stock portfolio tracker, and a calendar — into one clean, dark-mode web app.

It is not a multi-user product. There is no public signup. It is login-protected and built entirely for one person's personal use.

---

## Goals
- One place for everything the user cares about
- Fast, clean, and distraction-free
- Easy to extend — new tabs can be added without touching existing ones
- Works great on desktop

---

## Stack Summary
| Concern | Tool |
|---|---|
| Framework | React + Vite |
| Styling | CSS Modules |
| Data Fetching | React Query |
| Global State | Context API |
| Backend / DB | Supabase |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Soccer API | API-Football |
| Stock API | Finnhub |
| Recipe Parsing | Supabase Edge Functions |

---

## Tabs
| Tab | Description |
|---|---|
| ⚽ Soccer | Auto-pulled fixtures for next 7 days based on followed teams and players |
| 🍳 Recipes | Personal recipe book — manual entry or import from URL |
| 📈 Stocks | Portfolio tracker with live prices, manual share entry, privacy mode |
| 📅 Calendar | Personal event calendar with optional end time and location |

---

## Key Constraints
- Single user only — no multi-tenancy needed beyond Supabase RLS
- No public signup — account created directly in Supabase dashboard
- Google Calendar sync is explicitly out of scope for now — planned for a future phase
- All API keys must be stored as environment variables, never hardcoded
