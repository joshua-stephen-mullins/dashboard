# MCP.md — Dashboard MCP Server

## What It Is

A [Model Context Protocol](https://modelcontextprotocol.io) server hosted on Cloudflare Workers that gives Claude (web, mobile, and Claude Code) direct read/write access to the dashboard's Supabase data. This enables Claude to act as a personal assistant — adding recipes, checking fixtures, managing holdings, and creating calendar events on your behalf.

---

## Architecture

- **Runtime**: Cloudflare Workers (always on, free tier, 100k requests/day)
- **Transport**: Streamable HTTP (stateless, serverless-friendly)
- **Auth**: Secret-in-path. The only served route is `/mcp/<MCP_AUTH_SECRET>`; every other path returns 404. No OAuth, no Bearer tokens — the URL itself is the credential, so treat the full URL as a secret.
- **Database access**: Supabase service-role key (bypasses RLS — stored as a Cloudflare secret, never in source code)
- **Location in repo**: `mcp/` — a fully independent deployable, no shared code with the React app

### Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /mcp/<MCP_AUTH_SECRET>` | MCP protocol endpoint (JSON-RPC: `initialize`, `tools/list`, `tools/call`) |
| anything else | 404 |

If `MCP_AUTH_SECRET` is ever exposed (committed, pasted publicly), rotate it: generate a new one, `npx wrangler secret put MCP_AUTH_SECRET`, update `.dev.vars`, redeploy, and re-add the claude.ai connector with the new URL.

---

## Tools Exposed

### Recipes
| Tool | Description |
|---|---|
| `list_recipes` | List all saved recipes (name, tags, cook time, servings) |
| `get_recipe` | Get full details of a recipe by ID |
| `import_recipe` | Import a recipe from a URL via the `parse-recipe` edge function |
| `delete_recipe` | Remove a recipe by ID |

### Soccer Fixtures
| Tool | Description |
|---|---|
| `list_followed_teams` | List all followed teams |
| `list_followed_players` | List all followed players |
| `get_fixtures` | Fetch upcoming fixtures (next 7 days) from API-Football for all followed teams/players |
| `follow_team` | Follow a team by API-Football team ID |
| `unfollow_team` | Unfollow a team by row ID |

### Stocks
| Tool | Description |
|---|---|
| `list_holdings` | List all portfolio holdings (ticker, shares, avg cost) |
| `add_holding` | Add a new holding |
| `update_holding` | Update shares or avg cost for an existing holding |
| `delete_holding` | Remove a holding |

### Calendar
| Tool | Description |
|---|---|
| `list_events` | List events within a date range (YYYY-MM-DD), optionally filtered by `category_id`, to uncategorized events only, or to incomplete items only |
| `add_event` | Create a new event (accepts `category_id`, `course`, `completed`) |
| `update_event` | Update an existing event by ID |
| `delete_event` | Delete an event by ID |
| `categorize_events` | File up to 200 events under one category in a single call (or pass `category_id: null` to clear it) |
| `list_event_categories` | List event categories with color and coursework flag |
| `add_event_category` | Create a new event category |
| `update_event_category` | Update a category by ID |
| `delete_event_category` | Delete a category by ID — its events become uncategorized |

### Books
| Tool | Description |
|---|---|
| `list_books` | List all books (title, author, status, rating, genre) |
| `get_book` | Get full details of a book by ID |
| `add_book` | Add a new book manually |
| `lookup_book_by_isbn` | Look up a book by ISBN via the `lookup-book` edge function and add it to the library |
| `update_book` | Update a book by ID — only provided fields are changed (commonly used to change status) |
| `delete_book` | Delete a book by ID |

### Clothes
| Tool | Description |
|---|---|
| `list_clothes` | List all clothing items (name, category, color, status, wear count) |
| `get_clothing_item` | Get full details of a clothing item by ID |
| `add_clothing_item` | Add a new clothing item |
| `update_clothing_item` | Update a clothing item by ID |
| `log_wear` | Log a wear for a clothing item — increments `wear_count` and sets `last_worn` to today |
| `delete_clothing_item` | Delete a clothing item by ID |

### Miniatures
| Tool | Description |
|---|---|
| `list_miniatures` | List all miniatures (name, faction, storage location, quantity) |
| `get_miniature` | Get full details of a miniature by ID |
| `add_miniature` | Add a new miniature |
| `update_miniature` | Update a miniature by ID |
| `delete_miniature` | Delete a miniature by ID |

---

## Adding Tools for a New Tab

When a new tab is added to the dashboard, add its tools to the MCP server:

1. Create `mcp/src/tools/<tabname>.ts` — export a `register<Tab>Tools(server, supabase, env)` function
2. Import and call it in `mcp/src/index.ts` alongside the existing tools
3. Deploy: `cd mcp && npx wrangler deploy`

For collection-style tabs (Recipes, Books, Clothes, Miniatures) use `mcp/src/tools/recipes.ts` as the structural reference — it has the closest data shape (manual entry + URL import + image handling). Tools that wrap edge functions (like `lookup_book_by_isbn` calling `lookup-book`) should call the same edge function the frontend uses, never duplicating the logic in the Worker.

Always run `npm run typecheck` from `mcp/` before deploying. Claude.ai picks up the new tools automatically on the next conversation — no reconfiguration needed.

---

## Secrets

All secrets are stored in Cloudflare Workers → your worker → Settings → Variables (as encrypted secrets). Never put them in `wrangler.toml` or source code.

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — full DB access, bypasses RLS |
| `MCP_AUTH_SECRET` | Strong random string — the path segment that gates the MCP endpoint (`/mcp/<secret>`) |
| `USER_ID` | Supabase auth UUID of the single user (Authentication → Users in Supabase dashboard) |
| `FOOTBALL_API_KEY` | API-Football key for fetching live fixtures |

Generate `MCP_AUTH_SECRET` with:
```bash
openssl rand -hex 32
```

---

## Deployment

### One-time setup

1. Log in to Cloudflare via Wrangler (run from `mcp/` directory):
   ```bash
   cd mcp
   npx wrangler login
   ```
   This opens a browser to authorize Wrangler with your Cloudflare account.

2. Register a `workers.dev` subdomain if you haven't — go to **dash.cloudflare.com → Workers & Pages → Get started**.

3. Install dependencies and set secrets:
   ```bash
   npm install
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put MCP_AUTH_SECRET
   npx wrangler secret put USER_ID
   npx wrangler secret put FOOTBALL_API_KEY
   ```

4. Deploy:
   ```bash
   npx wrangler deploy
   ```
   Cloudflare outputs the Worker URL: `https://dashboard-mcp.<your-subdomain>.workers.dev`

### Ongoing deployments

```bash
cd mcp && npx wrangler deploy
```

Independent of the frontend — no need to redeploy Vercel when the MCP server changes.

---

## Connecting to Claude.ai (web + mobile)

Requires a Claude Pro account. The server presents no OAuth metadata, so claude.ai connects to it as an unauthenticated server — the secret in the URL is the auth.

1. Go to [claude.ai](https://claude.ai) → Settings → **Connectors**
2. Click **Add custom connector**
3. Enter a name (e.g. `dashboard-mcp`) and the Worker URL **including the secret**:
   ```
   https://dashboard-mcp.<your-subdomain>.workers.dev/mcp/<MCP_AUTH_SECRET>
   ```
4. Leave the OAuth fields blank and click **Add** — the tool list should appear

The connector is available in all claude.ai conversations on web and mobile. After rotating the secret, remove the connector and re-add it with the new URL.

---

## Connecting to Claude Code

Add to `.claude/settings.json` in the project root:

```json
{
  "mcpServers": {
    "dashboard": {
      "type": "url",
      "url": "https://dashboard-mcp.<your-subdomain>.workers.dev/mcp/<MCP_AUTH_SECRET>"
    }
  }
}
```

Do not commit `.claude/settings.json` if it contains the secret — add it to `.gitignore`.

---

## Local Development

```bash
cd mcp
npx wrangler dev
```

Runs the Worker locally at `http://localhost:8787`. Point Claude Code's config at the local URL during development.

Secrets are not available in `wrangler dev` by default — use a `.dev.vars` file (never committed):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MCP_AUTH_SECRET=...
USER_ID=...
FOOTBALL_API_KEY=...
```
