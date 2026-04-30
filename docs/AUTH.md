# AUTH.md — Dashboard

## Overview
Dashboard uses Supabase Auth with email + password. There is only one user. There is no public signup flow — the account is created manually in the Supabase dashboard.

---

## Setup (One Time)
1. Go to the Supabase dashboard → Authentication → Users
2. Click "Invite user" or "Add user" and create the account with your email and password
3. That's it — no code changes needed for account creation

---

## How It Works
- Supabase Auth manages the session and persists it in localStorage automatically
- On app load, the `AuthContext` checks for an existing session via `supabase.auth.getSession()`
- If no session exists, the user is redirected to `/login`
- On successful login, the user is redirected to `/soccer` (default tab)
- On logout, the session is cleared and the user is redirected to `/login`

---

## AuthContext
Located at `src/context/AuthContext.jsx`.

Provides the following to the rest of the app:
- `user` — the current Supabase user object (or null)
- `loading` — boolean, true while the initial session check is in progress
- `login(email, password)` — calls `supabase.auth.signInWithPassword()`
- `logout()` — calls `supabase.auth.signOut()`

---

## Protected Routes
Located at `src/components/ProtectedRoute/ProtectedRoute.jsx`.

Wraps all tab routes. If `user` is null and `loading` is false, redirects to `/login`. While `loading` is true, renders nothing (or a minimal loading state) to avoid a flash of the login page.

```jsx
// Usage in App.jsx
<Route path="/soccer" element={
  <ProtectedRoute>
    <SoccerTab />
  </ProtectedRoute>
} />
```

---

## Routes
| Route | Protected | Description |
|---|---|---|
| `/login` | No | Login page |
| `/` | Yes | Redirects to `/soccer` |
| `/soccer` | Yes | Soccer tab |
| `/recipes` | Yes | Recipes tab |
| `/stocks` | Yes | Stocks tab |
| `/calendar` | Yes | Calendar tab |

---

## Login Page
- Located at `src/tabs/login/` (or `src/pages/Login/`)
- Simple form: email field, password field, submit button
- No "forgot password" link, no "sign up" link
- On error, show a generic "Invalid credentials" message
- On success, navigate to `/soccer`

---

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
