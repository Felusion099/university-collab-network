# University Collaboration Platform

A combined, full-stack university collaboration network — the polished **Campus UI**
(from the C1 prototype) wired to the battle-tested **UCN API** (Express + Prisma +
PostgreSQL). One platform, one API, two modes.

## What is this?

A university-scoped platform that connects **students, professors, researchers,
projects, clubs, events and services** into one discoverable, collaborative graph.
The core question it answers: *who / what project / what research / what
opportunity should I know about right now?*

## Architecture

```
university-collab-platform/
├── apps/
│   ├── web/                    Campus UI — React 19, Vite, Tailwind v4
│   │   └── src/
│   │       ├── services/api/   API client, adapters (API DTO → UI types), live data layer
│   │       ├── context/        AuthContext (live/demo session) + AppContext (dual-mode state)
│   │       ├── components/     discovery, dashboard, home, auth, profile, creation, common
│   │       └── data/           mock seed data (demo mode)
│   └── api/                    UCN backend — Express 4, TypeScript, Prisma 5, PostgreSQL
│       ├── prisma/             44 models, migrations, seed (Demo@1234 credentials)
│       ├── src/                routes → controllers → services → repositories
│       └── tests/              11 suites, 123 tests
├── packages/
│   ├── shared-types/           Zod schemas — the single source of truth for the API contract
│   └── config/                 shared eslint / prettier / tsconfig bases
└── docs/                       PROJECT_SPEC, ARCHITECTURE, DATABASE_SCHEMA, API_CONTRACT
```

**Data flow (live mode):** components → `AppContext` actions → `services/api/live.ts`
→ `client.ts` (fetch + 401 refresh dedup) → API → PostgreSQL. API DTOs are mapped
onto the UI's display types in `services/api/adapters.ts` — components render
unchanged in both modes.

## Two modes

| Mode | Data source | Auth | Use case |
|------|------------|------|----------|
| **demo** (default) | localStorage + rich mock data | Persona switcher (6 mock users) | Instant preview, UI development, no setup |
| **live** | Real API + PostgreSQL | Real login/signup (JWT + refresh rotation) | The actual product |

Switch with `VITE_API_MODE` in `apps/web/.env`, or click
**"Try the demo mode"** / sign in from the login screen at runtime.

## Quick start

### 0. Prerequisites
- Node ≥ 20, pnpm ≥ 9 (`corepack enable`)
- PostgreSQL 14+ running on `localhost:5432`

### 1. Database setup

```bash
# create role + database (skip if they exist)
psql -U postgres -c "CREATE ROLE ucn_dev LOGIN PASSWORD 'ucn_dev_pw';"
psql -U postgres -c "CREATE DATABASE ucn_dev OWNER ucn_dev;"

# apply schema + seed demo data (users log in with Demo@1234)
pnpm --filter @app/api prisma:generate
pnpm --filter @app/api db:push
pnpm --filter @app/api prisma:seed
```

Seeded accounts (password **`Demo@1234`** for all):
- `priya.sharma@seed.university.edu` — student
- `vikram.singh@seed.university.edu` — professor
- `ananya.rao@seed.university.edu` — researcher

### 2. Run the API

```bash
pnpm dev:api          # http://localhost:4000
```

(`apps/api/.env` ships configured for the defaults above.)

### 3. Run the web app

```bash
pnpm dev              # http://localhost:3000
```

Demo mode works with zero backend. For the full experience set
`VITE_API_MODE="live"` in `apps/web/.env` and sign in with a seeded account.

## Verify everything

```bash
pnpm typecheck        # both apps, strict TS
pnpm test             # 11 API test suites (123 tests) incl. live-DB auth lifecycle
pnpm build            # production web bundle + API
```

## What's wired (live mode)

| Feature | Backend integration |
|---------|--------------------|
| Auth | `POST /auth/signup`, `/auth/login`, refresh rotation via httpOnly cookie, `GET /auth/me`, logout |
| People & Labs | `GET /users` + per-user profile hydration (privacy-filtered server-side) |
| Projects | `GET/POST /projects`, join-requests (`POST /projects/:id/join-requests`) — **acceptance creates real memberships** |
| Proposals / Invites | `GET /projects/:id/join-requests`, `GET /users/me/join-requests`, accept/reject endpoints |
| Messaging | `POST /conversations/direct` (open-or-create), messages, mark-read; SSE stream available |
| Events | `GET /events`, `POST /events/:id/register` |
| Communities | `GET /organizations` + membership hydration, join/leave endpoints |
| Collaboration requests | `POST /connections` + `PATCH /connections/:id` (pending/accepted/declined) |
| Notifications | `GET /notifications`, mark-read / read-all |
| Profile updates | `PATCH /users/me/profile`, skills via `POST /users/me/skills` (auto skill creation) |
| Bookmarks, services, portfolio items, council notices | Client-side (session-scoped in live mode) — documented Campus-UI features |

## API extensions made for the combined project

The UCN `Project` model gained optional Campus-UI fields (`category`,
`deadline_text`, `max_team_size`, `collaboration_type`, `requirements` jsonb) and
`Event` gained `capacity` + `tags` — all nullable, applied via `prisma db push`,
mirrored in `packages/shared-types`. The core UCN model is unchanged when they
are absent.

## Known limits (by design, documented upstream)

- Real-time messaging: **implemented** — SSE stream (`/conversations/:id/stream`)
  delivers messages instantly in the open thread + an 8s poll keeps
  conversations, notifications, projects and events fresh while running
  (no reload needed). WebSocket (Socket.IO) remains the documented upgrade path
- Multi-university federation deferred — `university_id` FK reserved
- Services / portfolio items / council notices are client-side features
- People list does not poll (N+1 hydration) — new users appear on next login/reload
- No security-hardening pass yet (upstream Phases 10–14)

## Responsive design

- Mobile messages layout: conversation list ↔ chat toggle with a back button (<md shows one pane at a time)
- All views use fluid grids (`grid-cols-1` → `sm`/`md`/`lg` breakpoints) and wrapping filter bars
- Modals are viewport-safe (`max-h-[90vh]`, scrollable, full-width on phones)
- Navbar collapses to a drawer below `xl`; quick actions move into it

## Deploying live (free tiers)

**Stack**: Web on **Vercel** (static) + API on **Render** (Node service) + DB on **Neon** (serverless Postgres).

### 1. Database — Neon (neon.tech)
1. Sign up with GitHub → **Create project** (free tier, always-on).
2. Copy the **connection string** (`postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

### 2. API — Render (render.com)
1. New → **Web Service** → connect this GitHub repo (branch `combined-platform`).
2. **Root Directory**: `apps/api`
3. **Build Command**: `pnpm install && pnpm prisma generate && pnpm build`
4. **Pre-Deploy Command**: `pnpm prisma db push` (applies the schema; safe re-runs)
5. **Start Command**: `node dist/server.js`
6. **Environment**:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your Neon connection string>`
   - `JWT_ACCESS_SECRET=<long random string>`
   - `JWT_REFRESH_SECRET=<another long random string>`
   - `JWT_ACCESS_TTL=15m` · `JWT_REFRESH_TTL=7d`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app`
   - `APP_BASE_URL=https://<your-vercel-app>.vercel.app`
   - `UNIVERSITY_EMAIL_DOMAINS=university.edu`
7. Deploy → note the URL (e.g. `https://ucn-api.onrender.com`).
8. Seed once (optional): run locally with `DATABASE_URL=<neon string> pnpm prisma:seed`.

### 3. Web — Vercel (vercel.com)
1. Add New → **Project** → this repo (branch `combined-platform`).
2. **Root Directory**: `apps/web` (Vercel auto-detects the pnpm workspace + the Vite preset).
3. **Environment**:
   - `VITE_API_MODE=live`
   - `VITE_API_BASE_URL=https://ucn-api.onrender.com/api/v1`
4. Deploy.

### Production notes
- The refresh cookie uses `SameSite=None; Secure` in production (set above) — cross-site sessions work.
- Render's free tier sleeps after 15 min idle — the first request wakes it (~30-60s cold start).
- The email verification logs the link (dev mail service) — signup → login works without verifying.
- Sign up a user, then seed/startup data via the Admin Panel (admin account).
