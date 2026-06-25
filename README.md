# Planner

A personal weekly planner with schedule blocks, sleep tracking, journal, analytics, and gamification (XP, badges, streaks). Data syncs to Supabase when signed in.

The app lives in the `planner/` directory.

## Prerequisites

- **Node.js** 20+ and **npm**
- **Supabase** project ([supabase.com](https://supabase.com))
- **Google Cloud** OAuth client (for sign-in and optional Calendar sync)

## Quick start (local dev)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd planner/planner
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID (Calendar overlay only) |

### 3. Supabase database

In **Supabase → SQL Editor**, run migrations in order:

```
planner/supabase/migrations/0001_cal_style_schema.sql
planner/supabase/migrations/0002_extended_schema.sql
```

This creates normalized tables (`days`, `blocks`, `journal_entries`, `habits`, etc.) with row-level security.

> The app **reads** the legacy `planner_state` JSON blob on login for full state restore. On every save it **dual-writes** to normalized tables via `syncNormalizedState.ts`. Run both migrations so dual-write succeeds.

### 4. Supabase Auth (Google)

**Authentication → Providers → Google**

- Enable Google
- Paste your Google **Client ID** and **Client Secret**

**Authentication → URL Configuration**

| Setting | Local dev | Production |
|---------|-----------|------------|
| Site URL | `http://localhost:5173` | `https://your-site.netlify.app` |
| Redirect URLs | `http://localhost:5173` | `https://your-site.netlify.app` |

### 5. Google Cloud OAuth

Create a **Web application** OAuth client at [Google Cloud Console](https://console.cloud.google.com/):

**Authorized JavaScript origins**

```
http://localhost:5173
https://domain.com
```

**Authorized redirect URIs** (Supabase callback only)

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

For Calendar sync, also enable the **Google Calendar API** on the same project.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with Google.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |

### E2E tests

Playwright starts the dev server on port **4173** automatically:

```bash
npx playwright install chromium   # first time only
npm run test:e2e
```

## Project structure

```
planner/                    # Git repo root
├── README.md
├── .gitignore              # Ignores .cursor/ and OS junk at repo root
└── planner/                # Application package
    ├── src/
    │   ├── app/            # App shell, routing
    │   ├── components/     # UI (schedule, journal, analytics, …)
    │   ├── engine/         # Schedule, XP, badges, insights logic
    │   ├── services/       # Supabase, Google Calendar, migration
    │   ├── store/          # Zustand state + cloud sync
    │   └── types/
    ├── supabase/
    │   ├── migrations/     # Postgres schema
    │   └── scripts/        # One-off admin SQL (e.g. data restore)
    ├── tests/e2e/          # Playwright specs
    └── docs/               # Bug inventory, notes
```

## Deploying (Netlify)

1. **Build command:** `npm run build`
2. **Publish directory:** `planner/dist` (if base dir is `planner/`) or `dist` (if base dir is the app folder)
3. Set the same `VITE_*` env vars in Netlify
4. Add your Netlify URL to Supabase **Redirect URLs** and Google **JavaScript origins**

## How week rollover works

When you open the app and your saved week is in the past, the app automatically:

1. Snapshots last week to history
2. Starts a fresh week (same block template, completions reset)
3. Syncs to the cloud ~2 seconds later

No manual archive needed for a normal Monday rollover.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login redirects to `localhost` on production | Add Netlify URL to Supabase Redirect URLs; set Site URL to production |
| Empty schedule after sign-in | Legacy blob may be under old Google `sub` ID — see `planner/supabase/scripts/restore_user_and_cleanup.sql` |
| Calendar sync fails | Set `VITE_GOOGLE_CLIENT_ID` and enable Calendar API in Google Cloud |
| `Invalid API key` | Check `VITE_SUPABASE_ANON_KEY`; restart dev server after `.env` changes |

## Contributing

1. Create a branch from `main`
2. Make changes in `planner/`
3. Run `npm run lint`, `npm run test`, and `npm run test:e2e` before opening a PR
4. Do not commit `.env`, `node_modules`, `dist`, or `.cursor/` (IDE-local files)
