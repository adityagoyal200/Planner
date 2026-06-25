# Planner v1.0

**Your personal operating system for the week.**

First stable release of Planner — a weekly schedule app with sleep tracking, journaling, analytics, and light gamification. Sign in with Google, sync across devices, and let the app handle week rollover automatically.

---

## Highlights

- **Weekly schedule builder** — drag-and-drop blocks, focus timer, completion tracking
- **Sleep analysis** — planned vs actual sleep, debt tracking, week-aware charts
- **Journal** — mood, energy, intentions, reflections, gratitude (scoped per week)
- **Analytics dashboard** — XP, badges, insights, time breakdown, weekly history
- **Google sign-in + cloud sync** — Supabase Auth with per-user data isolation
- **Automatic week rollover** — last week archived, fresh week starts on next visit
- **Google Calendar overlay** — optional sync for selected day
- **Regression tests** — Vitest unit tests + Playwright E2E specs

---

## Schedule

- Visual **timeline** with editable block times, durations, and on/off toggles
- **Block types** — routine, deep work, study, exercise, sleep, free time, and more
- **Drag-and-drop** reordering and block type picker
- **Focus timer** (Pomodoro) with configurable work/break intervals
- **Block inspector** for quick edits
- **Week navigator** — browse current and past weeks from any tab
- **New week banner** — summary when a week is auto-archived
- **Cross-day carry-over** for blocks that span midnight

## Sleep

- Log actual wake/sleep times per day
- **Sleep analysis** panel — planned schedule vs reality
- Improved sleep duration math (naps vs main sleep separated)
- Read-only sleep view when browsing historical weeks

## Journal

- Daily **mood** and **energy** logging
- **Intention**, **reflection**, and **gratitude** entries
- **Mood chart** over the selected week
- Journal data keyed by week — no cross-week leakage

## Analytics & gamification

- **XP system** with levels and level-up modal
- **Badges** earned from weekly habits
- **Day score heatmap**, sleep line chart, time donut, focus sparkline
- **AI-style insights** — sleep patterns, completion trends, category balance
- **Weekly history** — archived snapshots with completion %, sleep, and XP

## Auth & sync

- **Sign in with Google** via Supabase Auth
- Cloud state syncs to Supabase (`planner_state` blob, debounced ~2s)
- **Legacy data migration** — old Google `sub` blobs migrate to normalized tables on first login
- **Normalized Postgres schema** with row-level security (`days`, `blocks`, `journal_entries`, `user_settings`, `week_snapshots`)

## Settings

- Pomodoro intervals, accent color, compact mode
- Gamification toggle
- Custom block categories
- Manual week archive (optional — auto-rollover handles the normal case)

## Developer experience

- **README** with full local setup guide
- `.env.example` for required variables
- `planner/supabase/migrations/0001_cal_style_schema.sql` — database setup
- `planner/supabase/scripts/restore_user_and_cleanup.sql` — legacy data restore helper
- Vitest: `dateUtils`, `sleepUtils`, `computeSchedule`
- Playwright: history navigation + sleep regression specs

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand |
| Backend | Supabase (Auth + Postgres + RLS) |
| Integrations | Google OAuth, Google Calendar API |
| Testing | Vitest, Playwright |
| Deploy | Netlify-ready static build |

---

## Getting started

```bash
git clone <your-repo-url>
cd planner/planner
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

See [README.md](README.md) for Supabase migration, Google OAuth setup, and deployment.

---

## Known limitations (v1.0)

- Primary sync still uses the `planner_state` JSON blob; normalized tables are written on migration but not yet the sole read/write path
- Week rollover runs on **app open**, not at midnight while the tab stays open
- Google Calendar token is session-local (not persisted to Supabase)
- Some edge cases around cross-midnight blocks and week-boundary sleep logging may still feel rough — see `planner/docs/BUG_INVENTORY.md`

---

## Upgrade notes

If you used an older build that stored data under a Google `sub` ID instead of Supabase `auth.uid()`:

1. Sign in with Google once (creates Supabase auth user)
2. Run `planner/supabase/scripts/restore_user_and_cleanup.sql` in Supabase SQL Editor if data doesn't appear
3. Clear browser `localStorage` keys `planner-storage` and `planner-auth`, then sign in again

For production (Netlify): add your hosted URL to Supabase **Redirect URLs** and Google **JavaScript origins**.

---

## What's next

- Read path from normalized tables (blob remains fallback today)
- Deeper calendar two-way sync (date-aware edits)
- More E2E coverage for auth and cloud sync flows

### Shipped after initial v1.0 draft

- **Habits tab** with weekly completion grid and cross-week streaks
- **Block subtasks** on the timeline
- **Commute as real blocks** (drag, delete, edit like any block)
- **Mobile-responsive** layout across schedule, settings, and login
- **Browser notifications** (blocks, sleep, streak, focus timer)
- **Midnight week rollover** while the app stays open
- **Normalized dual-write** on every cloud save (`0002` migration for habits/subtasks)

---

**Full changelog:** compare `v1.0` against earlier commits on `main`.
