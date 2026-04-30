# ARCHITECTURE.md — Dashboard

## Folder Structure

```
dashboard/
├── public/                        # Static assets (favicon, etc.)
├── src/
│   ├── tabs/                      # One folder per tab — fully isolated
│   │   ├── soccer/
│   │   │   ├── components/        # Soccer-specific components
│   │   │   ├── hooks/             # Soccer-specific React Query hooks
│   │   │   ├── styles/            # Soccer-specific CSS Modules
│   │   │   └── index.jsx          # Tab entry point
│   │   ├── recipes/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── styles/
│   │   │   └── index.jsx
│   │   ├── stocks/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── styles/
│   │   │   └── index.jsx
│   │   └── calendar/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── styles/
│   │       └── index.jsx
│   ├── components/                # Shared UI components
│   │   ├── Layout/
│   │   ├── Navbar/
│   │   ├── Modal/
│   │   └── ProtectedRoute/
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state available app-wide
│   ├── hooks/                     # Shared custom hooks
│   ├── lib/                       # API clients and utilities
│   │   ├── supabase.js            # Supabase client instance
│   │   ├── football.js            # API-Football client
│   │   └── finnhub.js             # Finnhub client
│   ├── styles/                    # Global styles
│   │   ├── global.css             # Reset, base styles, root variables
│   │   └── tokens.css             # Design tokens (colors, spacing, fonts)
│   ├── App.jsx                    # Root component, routing
│   └── main.jsx                   # Entry point
├── .env                           # Local environment variables (never commit)
├── .env.example                   # Template showing required env vars (safe to commit)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Tab Isolation Rule
Tabs are fully self-contained modules. This means:
- A tab's components live inside its own `components/` folder
- A tab's data fetching logic lives inside its own `hooks/` folder
- A tab's styles live inside its own `styles/` folder
- **No tab imports from another tab**
- Shared UI (buttons, modals, layout) lives in `src/components/`
- Shared logic lives in `src/hooks/`
- API clients live in `src/lib/`

---

## Adding a New Tab
1. Create a new folder under `src/tabs/<tabname>/`
2. Add `components/`, `hooks/`, `styles/`, and `index.jsx` inside it
3. Register the tab in `App.jsx` — add the route and add it to the Navbar
4. Nothing else needs to change

---

## Routing
- `/login` — Login page (public)
- `/` — Redirects to `/soccer` if authenticated
- `/soccer` — Soccer tab (protected)
- `/recipes` — Recipes tab (protected)
- `/stocks` — Stocks tab (protected)
- `/calendar` — Calendar tab (protected)
- All protected routes redirect to `/login` if the user is not authenticated

---

## Naming Conventions
- **Components**: PascalCase — `GameCard.jsx`, `RecipeModal.jsx`
- **CSS Modules**: same name as component — `GameCard.module.css`
- **Hooks**: camelCase prefixed with `use` — `useFixtures.js`, `useHoldings.js`
- **Lib files**: camelCase — `supabase.js`, `finnhub.js`
- **Tab entry points**: always `index.jsx`
