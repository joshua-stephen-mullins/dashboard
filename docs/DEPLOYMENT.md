# DEPLOYMENT.md — Dashboard

## Platform
**Vercel** — zero config deployments for React + Vite, automatic deploys from GitHub, custom domain support.

## Domain
Custom domain purchased through **Cloudflare Registrar**. DNS is managed in the Cloudflare dashboard.

---

## Overview
- Code is pushed to GitHub
- Vercel is connected to the GitHub repo and automatically deploys on every push to `main`
- The live app is served at the custom domain
- SSL is handled automatically by Vercel
- Environment variables are set in the Vercel dashboard (not in code)

---

## Initial Setup (One Time)

### 1. Create a Vercel Account
- Go to [vercel.com](https://vercel.com) and sign up
- Connect your GitHub account

### 2. Import the Repo
- In the Vercel dashboard click "Add New Project"
- Select your GitHub repo
- Vercel will auto-detect it as a Vite project
- **Build settings** (should be auto-filled, verify these):
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### 3. Set Environment Variables
Before deploying, add all environment variables in Vercel:
- Go to Project Settings → Environment Variables
- Add each variable for the `Production` environment (and `Preview` if desired):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_FOOTBALL_API_KEY
VITE_FINNHUB_API_KEY
```

These must match exactly what is in your local `.env` file. Vercel injects them at build time.

### 4. Deploy
- Click "Deploy" — Vercel builds and deploys the app
- You'll get a temporary `.vercel.app` URL to verify everything works before pointing your domain

### 5. Add Custom Domain
- In Vercel go to Project Settings → Domains
- Add your custom domain (e.g. `dashboard.com` or `www.dashboard.com`)
- Vercel will provide DNS records to add — typically:
  - An `A` record pointing to Vercel's IP for the apex domain (`@`)
  - A `CNAME` record for `www` pointing to `cname.vercel-dns.com`

### 6. Configure DNS in Cloudflare
- Go to your Cloudflare dashboard → your domain → DNS
- Add the records Vercel provided
- **Important**: Set the proxy status to **DNS only (grey cloud)** for both records
  - Do NOT use the orange cloud (Cloudflare proxy) — it will interfere with Vercel's SSL certificate generation
- Changes typically propagate within minutes

### 7. SSL
- Vercel automatically provisions an SSL certificate once DNS propagates
- No manual setup required — the site will be live at `https://yourdomain.com`

---

## Ongoing Deployments
- Every push to the `main` branch triggers an automatic production deployment on Vercel
- Vercel also creates preview deployments for any other branches/PRs — useful for testing changes before merging to `main`
- Deployment logs are visible in the Vercel dashboard

---

## Environment Variables — Local vs Production
| Location | How to Set |
|---|---|
| Local development | `.env` file in project root (never committed to GitHub) |
| Vercel production | Vercel dashboard → Project Settings → Environment Variables |

Always update both when adding a new environment variable.

---

## Vite SPA Routing Fix
React Router requires all routes to serve `index.html` — otherwise a hard refresh on `/soccer` will return a 404. Vercel handles this automatically for Vite projects, but verify by adding a `vercel.json` to the project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## .gitignore
Make sure the following are in `.gitignore` before the first commit:

```
node_modules/
dist/
.env
.env.local
```

The `.env.example` file (with empty values) **should** be committed so it's clear what environment variables are needed.

---

## Checklist Before Going Live
- [ ] All environment variables set in Vercel dashboard
- [ ] `.env` is in `.gitignore` and never committed
- [ ] `vercel.json` rewrite rule added
- [ ] Custom domain added in Vercel
- [ ] Cloudflare DNS records added with proxy set to DNS only (grey cloud)
- [ ] SSL certificate provisioned (check Vercel dashboard)
- [ ] App loads at `https://yourdomain.com`
- [ ] Login works in production
- [ ] Supabase RLS policies are enabled on all tables
