# MCP.md — Dashboard MCP Server

## What It Is

A [Model Context Protocol](https://modelcontextprotocol.io) server hosted on Cloudflare Workers that gives Claude (web, mobile, and Claude Code) direct read/write access to the dashboard's Supabase data. This enables Claude to act as a personal assistant — adding recipes, checking fixtures, managing holdings, and creating calendar events on your behalf.

---

## Architecture

- **Runtime**: Cloudflare Workers (always on, free tier, 100k requests/day)
- **Transport**: Streamable HTTP (stateless, serverless-friendly)
- **Auth**: Bearer token — Claude sends `MCP_AUTH_SECRET` as an `Authorization` header on every request
- **Database access**: Supabase service-role key (bypasses RLS — the bearer token is the only access gate)
- **Location in repo**: `mcp/` — a fully independent deployable, no shared code with the React app

---

## Tools Exposed

### Recipes
| Tool | Description |
|---|---|
| `get_recipes` | List all saved recipes (name, tags, cook time) |
| `add_recipe` | Save a new recipe by URL — triggers the `parse-recipe` edge function |
| `delete_recipe` | Remove a recipe by ID |

### Soccer Fixtures
| Tool | Description |
|---|---|
| `get_fixtures` | Return upcoming fixtures for all followed teams/players |
| `get_followed_teams` | List teams and players the user follows |
| `add_followed_team` | Follow a new team by API-Football team ID |
| `remove_followed_team` | Unfollow a team |

### Stocks
| Tool | Description |
|---|---|
| `get_holdings` | List all stock holdings (ticker, shares, average cost) |
| `add_holding` | Add a new holding |
| `update_holding` | Update shares or average cost for an existing holding |
| `delete_holding` | Remove a holding |

### Calendar
| Tool | Description |
|---|---|
| `get_events` | Return calendar events within a date range |
| `add_event` | Create a new calendar event |
| `update_event` | Edit an existing event |
| `delete_event` | Remove an event |

---

## Secrets

All secrets are stored in Cloudflare Workers → Settings → Variables (as encrypted secrets). Never put them in `wrangler.toml` or source code.

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — full DB access, bypasses RLS |
| `MCP_AUTH_SECRET` | Strong random string used to authenticate Claude requests |

Generate `MCP_AUTH_SECRET` with:
```bash
openssl rand -hex 32
```

---

## Deployment

### One-time setup

1. Install the Cloudflare CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Install MCP server dependencies:
   ```bash
   cd mcp
   npm install
   ```

3. Set secrets in Cloudflare:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   wrangler secret put MCP_AUTH_SECRET
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```
   Cloudflare will output a URL like `https://dashboard-mcp.<your-subdomain>.workers.dev`.

### Ongoing deployments

```bash
cd mcp && wrangler deploy
```

This is independent of the frontend — no need to redeploy Vercel when the MCP server changes.

---

## Registering with Claude Code

Add to `.claude/settings.json` in the project root:

```json
{
  "mcpServers": {
    "dashboard": {
      "type": "url",
      "url": "https://dashboard-mcp.<your-subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_AUTH_SECRET>"
      }
    }
  }
}
```

The secret value in this file is local only — do not commit `.claude/settings.json` if it contains the secret. Add it to `.gitignore`.

---

## Registering with Claude.ai (web + mobile)

Requires a Claude Pro account.

1. Go to [claude.ai](https://claude.ai) → Settings → Integrations
2. Click "Add integration"
3. Enter the Worker URL: `https://dashboard-mcp.<your-subdomain>.workers.dev/mcp`
4. Add the header: `Authorization: Bearer <MCP_AUTH_SECRET>`
5. Save — the tools are now available in any Claude.ai conversation on web and mobile

---

## Local Development

For local testing, use `wrangler dev`:

```bash
cd mcp
wrangler dev
```

This runs the Worker locally at `http://localhost:8787`. You can point Claude Code's config at the local URL during development.

Secrets are not available in `wrangler dev` by default — use a local `.dev.vars` file (never committed):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MCP_AUTH_SECRET=...
```
