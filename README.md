# Dashboard

A private, single-user personal dashboard for tracking soccer fixtures, stocks, recipes, and calendar events.

---

## Features

- **Soccer** — auto-pulled fixtures for the next 7 days based on followed teams and players
- **Recipes** — personal recipe book with manual entry and URL import
- **Stocks** — portfolio tracker with live prices and a privacy mode toggle
- **Calendar** — personal event calendar with color-coded events and an upcoming events sidebar

---

## Tech Stack

| Concern | Tool |
|---|---|
| Framework | React + Vite |
| Styling | CSS Modules |
| Data Fetching | React Query |
| Global State | Context API |
| Backend / Database | Supabase |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Soccer Data | API-Football |
| Stock Prices | Finnhub |
| Recipe Parsing | Supabase Edge Functions |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [API-Football](https://www.api-football.com) API key
- A [Finnhub](https://finnhub.io) API key

### Installation

```bash
git clone https://github.com/yourusername/dashboard.git
cd dashboard
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FOOTBALL_API_KEY=your_api_football_key
VITE_FINNHUB_API_KEY=your_finnhub_key
```

### Running Locally

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

---

## Project Structure

```
src/
├── tabs/           # Each tab is a fully isolated module
│   ├── soccer/
│   ├── recipes/
│   ├── stocks/
│   └── calendar/
├── components/     # Shared UI components
├── context/        # Auth context
├── hooks/          # Shared custom hooks
├── lib/            # Supabase, Finnhub, API-Football clients
└── styles/         # Global styles and design tokens
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full folder structure and conventions.

---

## Documentation

| File | Description |
|---|---|
| [`docs/OVERVIEW.md`](docs/OVERVIEW.md) | Project summary and goals |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Folder structure, naming conventions, routing |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Supabase schema and RLS policies |
| [`docs/AUTH.md`](docs/AUTH.md) | Authentication flow and protected routes |
| [`docs/APIS.md`](docs/APIS.md) | External API setup and usage |
| [`docs/TABS.md`](docs/TABS.md) | Feature specs for each tab |
| [`docs/STYLING.md`](docs/STYLING.md) | CSS Modules conventions and design tokens |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing setup and guidelines |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel deployment and custom domain setup |

---

## Deployment

Deployed on Vercel with a custom domain via Cloudflare. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full setup guide.

---

## License

Private project — not open for public use.
