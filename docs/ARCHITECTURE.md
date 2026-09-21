# ARCHITECTURE.md

## 1. Layered Architecture
```
UI (pages, layouts)
 ↓
Components (presentational, reusable — see §5)
 ↓
Hooks / State (TanStack Query for server state, Zustand for client/session state)
 ↓
Services / API client (typed fetch wrappers — ONE per resource, no ad-hoc fetch calls in components)
 ↓
Backend: Routes → Controllers → Services → Repositories (Prisma) → Database
```
Business logic lives ONLY in backend `services/*`. Controllers just parse/validate (Zod) and call a service. Frontend components never talk to Prisma or contain authorization logic — they call `services/api/*.ts`, which calls the backend.

## 2. Monorepo Layout (pnpm workspaces + Turborepo)
```
/apps
  /web        → frontend (Vite + React + TS)
  /api        → backend (Express + TS + Prisma)
/packages
  /shared-types → Zod schemas + TS types shared by web & api (single source of truth for API contract shapes)
  /ui           → shared design-system components (optional, only if duplication across apps emerges)
  /config       → shared eslint/tsconfig/prettier config
```
Full file tree in `FILE_STRUCTURE.md`.

## 3. Authentication & Authorization Flow
1. Signup → `users` row created with `status = pending_verification`, `requested_role`.
2. Email verification link (university domain preferred, generic email allowed with `is_university_verified = false`).
3. Login → bcrypt check → JWT access token (15 min, Authorization header) + refresh token (7 day, httpOnly secure cookie).
4. Refresh rotation endpoint issues a new pair and revokes the old refresh token (stored hashed in `refresh_tokens` table for revocation support).
5. Authorization: `requireAuth` middleware validates JWT → attaches `req.user`. `requireRole([...])` middleware checks `verifications` table (see DECISIONS D-003), never `requested_role` alone, for professor/researcher/org/admin-gated routes.
6. Privacy filtering happens inside the service layer per DECISIONS D-004 — never trust the frontend to hide fields.

## 4. Search Architecture
- Single `/api/v1/search?q=&type=&filters=` endpoint fans out to per-entity Postgres full-text search (`tsvector` columns on name/bio/description/abstract fields) rather than a separate search engine for MVP — documented as a scale risk in DECISIONS if query volume grows (future: Meilisearch/Elasticsearch swap behind the same service interface).
- Results are grouped by entity type in the response (`{ people: [...], projects: [...], research: [...] }`), never a single flat array — matches spec §7 "categorize, don't dump."
- Debounced on the frontend (300ms), server-side pagination via cursor (`?cursor=&limit=`).

## 5. Design System
Tokens (colors, type scale, spacing, radius, shadow, motion, breakpoints) live in `apps/web/src/styles/tokens.css` as CSS variables, consumed by Tailwind config — never hardcoded hex/px values in components. Reusable component inventory (build once, reuse everywhere): `Navbar, Sidebar, ProfileCard, UserCard, ProjectCard, ResearchCard, ClubCard, StartupCard, EventCard, OpportunityCard, SkillBadge, VerificationBadge, SearchBar, FilterPanel, Modal, Toast, NotificationPanel, MessagePanel, PrivacyControls, ProfileHeader, Timeline, Skeleton, EmptyState, ErrorState`. See PROJECT_SPEC §"Anti-Crap Rule" before adding any new component — check this list first.

## 6. Team-Builder Match Score (spec §15)
Match score is a weighted, **explainable** function, computed server-side in `services/matching.service.ts`:
```
score = w1*skill_overlap + w2*research_topic_overlap + w3*availability_match
      + w4*department_proximity + w5*existing_connection_bonus
```
The response always includes the matched/unmatched criteria list (`✓ Python`, `✓ Machine Learning`, `✗ React`) alongside the numeric score — a bare percentage with no explanation is a spec violation (§15: "avoid meaningless recommendation scores without explanation").

## 7. Messaging
MVP: REST-backed (`POST /messages`, `GET /conversations/:id/messages?cursor=`), 5s client-side polling on open conversation. Interface `RealtimeService.subscribe(conversationId, cb)` is defined but backed by polling initially; swapping in Socket.IO later requires no controller/component changes (DECISIONS D-001).

## 8. Seed / Demo Data
`apps/api/prisma/seed.ts` generates interconnected demo data (a student who belongs to a club, contributes to a project, follows a topic, and is connected to a researcher — not independent rows per spec §39). Seed data is tagged `is_seed = true` on relevant tables and excluded from production seeding scripts.

## 9. Scale Considerations (documented, not built in MVP)
- `university_id` FK reserved on `users`/`organizations` for future multi-tenant support.
- Full-text search swap path noted in §4.
- File storage behind `StorageService` interface for later S3 migration.
- All list endpoints paginated from day one (no "works on 50 rows, breaks at 5000" endpoints).
