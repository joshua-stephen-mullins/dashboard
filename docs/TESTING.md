# TESTING.md — Dashboard

## Stack
- **Vitest** — test runner, integrates natively with Vite
- **React Testing Library** — component testing
- **@testing-library/user-event** — simulating real user interactions
- **jsdom** — simulated browser environment for Vitest

---

## Installation
```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

## Vitest Config
Add the following to `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

## Test Setup File
Create `src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

## package.json Scripts
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

## Where Tests Live
Tests are co-located with the code they test, following the isolated module structure. Every tab owns its own tests.

```
src/
├── tabs/
│   ├── stocks/
│   │   ├── components/
│   │   │   ├── HoldingsTable.jsx
│   │   │   └── HoldingsTable.test.jsx
│   │   ├── utils/
│   │   │   ├── calculations.js
│   │   │   └── calculations.test.js
│   │   └── index.jsx
│   ├── recipes/
│   │   ├── components/
│   │   │   ├── RecipeCard.jsx
│   │   │   └── RecipeCard.test.jsx
│   │   └── utils/
│   │       ├── filters.js
│   │       └── filters.test.js
│   ├── soccer/
│   │   └── utils/
│   │       ├── fixtures.js
│   │       └── fixtures.test.js
│   └── calendar/
│       └── utils/
│           ├── dates.js
│           └── dates.test.js
├── components/
│   ├── ProtectedRoute/
│   │   ├── ProtectedRoute.jsx
│   │   └── ProtectedRoute.test.jsx
└── test/
    └── setup.js                        # Global test setup
```

---

## What to Test

### Stocks Tab — Priority: High
The stocks tab has the most logic-heavy code and the privacy mode feature which is critical to get right.

**calculations.js** — unit test all of these:
- `calculatePositionValue(shares, price)` — shares × current price
- `calculatePL(shares, price, avgCost)` — P/L in dollars
- `calculatePLPercent(price, avgCost)` — P/L as percentage
- `calculateTotalValue(holdings)` — sum of all position values
- `calculateDayChange(holdings)` — total day change in dollars

**HoldingsTable.test.jsx** — component tests:
- Renders ticker, company name, and current price when privacy mode is OFF
- Replaces shares, avg cost, value, and P/L with `••••` when privacy mode is ON
- Privacy mode toggle switches between visible and hidden states

### Recipes Tab — Priority: Medium
**filters.js** — unit tests:
- `filterByTag(recipes, tag)` — returns only recipes matching the tag
- `filterBySearch(recipes, query)` — returns recipes whose name matches the search string
- `filterByTagAndSearch(recipes, tag, query)` — combined filter

**RecipeCard.test.jsx** — component tests:
- Renders recipe name, cook time, servings, and tags correctly
- Renders image when `image_url` is present
- Renders placeholder when `image_url` is null

### Soccer Tab — Priority: Medium
**fixtures.js** — unit tests:
- `deduplicateFixtures(fixtures)` — removes duplicate fixtures when a followed player and followed team share the same team
- `sortFixturesByDate(fixtures)` — sorts fixtures chronologically
- `groupFixturesByDate(fixtures)` — groups fixtures into date buckets

### Calendar Tab — Priority: Medium
**dates.js** — unit tests:
- `getDaysInMonth(year, month)` — returns correct number of days
- `getFirstDayOfMonth(year, month)` — returns correct starting weekday
- `isToday(date)` — correctly identifies today's date
- `formatEventTime(start, end)` — formats time range correctly, handles missing end time

### ProtectedRoute — Priority: High
- Renders children when user is authenticated
- Redirects to `/login` when user is null and loading is false
- Renders nothing while loading is true

---

## What NOT to Test
- Supabase queries directly — mock Supabase in tests, don't hit the real database
- Finnhub or API-Football API calls directly — mock the API clients
- CSS and visual styling
- Third party library internals

---

## Mocking Supabase
Create a mock at `src/test/mocks/supabase.js` and use it in tests that touch Supabase:

```js
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))
```

---

## Example Tests

### Unit test — calculations.js
```js
import { describe, it, expect } from 'vitest'
import { calculatePL, calculatePLPercent } from './calculations'

describe('calculatePL', () => {
  it('returns positive P/L when current price is above avg cost', () => {
    expect(calculatePL(10, 200, 150)).toBe(500)
  })

  it('returns negative P/L when current price is below avg cost', () => {
    expect(calculatePL(10, 100, 150)).toBe(-500)
  })

  it('returns 0 when price equals avg cost', () => {
    expect(calculatePL(10, 150, 150)).toBe(0)
  })
})

describe('calculatePLPercent', () => {
  it('calculates percentage gain correctly', () => {
    expect(calculatePLPercent(200, 150)).toBeCloseTo(33.33, 1)
  })
})
```

### Component test — privacy mode
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import HoldingsTable from './HoldingsTable'

const mockHoldings = [
  { ticker: 'AAPL', company_name: 'Apple', shares: 10, avg_cost: 150, price: 189.50, change: 1.2 }
]

describe('HoldingsTable privacy mode', () => {
  it('shows values when privacy mode is off', () => {
    render(<HoldingsTable holdings={mockHoldings} privacyMode={false} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('hides values when privacy mode is on', () => {
    render(<HoldingsTable holdings={mockHoldings} privacyMode={true} />)
    expect(screen.getAllByText('••••').length).toBeGreaterThan(0)
    expect(screen.queryByText('10')).not.toBeInTheDocument()
  })
})
```

---

## Running Tests
```bash
# Run all tests once
npm test

# Run in watch mode (re-runs on file changes)
npm test -- --watch

# Run with coverage report
npm run test:coverage

# Run tests for a specific file
npm test -- calculations.test.js
```

---

## Coverage Goals
Don't aim for 100% coverage — aim for coverage of what matters:
- All utility/calculation functions: **100%**
- Privacy mode behavior: **100%**
- ProtectedRoute auth logic: **100%**
- Component rendering: **key props and states only**
