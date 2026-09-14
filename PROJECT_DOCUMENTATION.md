# University Collaboration Network — Full Product Documentation

> A university-scoped collaboration platform connecting **students, professors, and researchers** with the people, projects, research, and opportunities that matter to them — built as a living portfolio and a real collaboration graph, not a social network.

**Stack:** TypeScript monorepo · Express + Prisma/PostgreSQL (API) · React + Vite + Tailwind + Zustand + TanStack Query (Web) · pnpm workspaces + Turborepo · Zod shared-types · JWT auth (access + refresh) · SSE realtime.

**Repositories / layout:**

```
university-collab-network/
├── apps/
│   ├── api/                  # Express backend (routes → controllers → services → repositories)
│   │   ├── prisma/           # schema.prisma (36 models) + 4 migrations
│   │   ├── src/routes/       # 19 route groups
│   │   ├── src/controllers/  # request translation only
│   │   ├── src/services/     # business logic + authorization + privacy
│   │   ├── src/repositories/ # Prisma queries (singleton client)
│   │   ├── src/middleware/   # requireAuth, requireRole, optionalAuth,
│   │   │                     # requireProfessorVerified, requireProfessorOwnership,
│   │   │                     # requireResearchOwnership, errorHandler, validate
│   │   └── tests/            # node:test suites (11 files)
│   └── web/                  # React SPA (23 page groups)
│       ├── src/pages/        # 23 routed areas incl. onboarding, me, messages
│       ├── src/components/   # design-system + PortfolioView, MessageButton…
│       ├── src/hooks/        # TanStack Query hooks (useMe, useMessages…)
│       └── src/services/api/ # typed API clients (apiFetch + refresh)
├── packages/
│   ├── shared-types/         # Zod schemas + TS types (single source of truth)
│   └── config/               # shared eslint/prettier config
├── PROJECT_SPEC.md · DATABASE_SCHEMA.md · API_CONTRACT.md
├── ARCHITECTURE.md · FILE_STRUCTURE.md · DECISIONS.md (D-001…D-024)
└── AGENT_HANDOFF.md
```

---

## 1. Architecture Overview

### 1.1 Layered backend (one direction, no shortcuts)

```
HTTP → route (validation, auth middleware)
     → controller (translate request → service call; never business logic)
     → service (business rules, server-side authorization, privacy filtering)
     → repository (Prisma queries)
     → PostgreSQL
```

- **Route layer** validates input with Zod schemas from `@app/shared-types` and applies auth middleware.
- **Controllers** are thin — they never contain business logic.
- **Services** own every rule: ownership checks, membership state transitions, privacy filtering, notification side-effects.
- **Repositories** are the only place Prisma is queried.

### 1.2 Frontend architecture

- **`apiFetch`** (`services/api/client.ts`) — one fetch wrapper for every call: injects `Authorization: Bearer <accessToken>` + `credentials: "include"`, handles 401 with a de-duplicated automatic refresh-then-retry, parses the canonical error shape `{ error: { code, message, fields? } }` into `ApiError`.
- **Session store** (`stores/session.store.ts`, Zustand) — `user`, `accessToken`, `status: idle | authenticated | unauthenticated`. Restored on boot via httpOnly refresh cookie → `POST /auth/refresh` → `GET /auth/me` (atomic `setSession`).
- **TanStack Query** — server state; queries are invalidated after mutations so the UI always represents backend state.
- **Design system** — Tailwind tokens mapped 1:1 to CSS variables in `styles/tokens.css` (light + dark via `.dark` class). No hardcoded colors; every component uses token classes.

### 1.3 The collaboration graph (core product model)

```
USER ─ ROLE PROFILE ─ SKILLS ─ RESEARCH TOPICS
  │
  ├─ PROJECTS (created / member)      ── ResearchTopic, Skills
  ├─ RESEARCH TEAMS (PI / member)     ── ResearchTopic
  ├─ PUBLICATIONS (author)            ── ResearchTopic
  ├─ ORGANIZATIONS (member / creator)
  ├─ CONNECTIONS, FOLLOWS
  ├─ CONVERSATIONS → MESSAGES         ── project / team / direct
  ├─ NOTIFICATIONS (real domain events)
  └─ JOIN REQUESTS (requests + invitations, both directions)
```

Every surface (profile, project, team, directory, search) renders from these real relationships. The portfolio is a **composed view** of them — never stored separately.

---

## 2. Database (36 models, 4 migrations)

**Migrations:** `20260828060000_init` · `20260913202403_add_onboarding_completed_at` · `20260913234446_project_visibility_join_requests` · `20260914003558_conversation_last_read_at`.

### 2.1 Identity & access

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Core identity | email, username (server-generated, D-013), phone (D-018), passwordHash, requestedRole, status, isUniversityVerified, universityDomain, avatarUrl, onboardingCompletedAt |
| **RefreshToken** | Rotating refresh tokens (hashed) | tokenHash, expiresAt, revokedAt |
| **Verification** | Role verification requests | (userId, roleClaimed) unique, status pending/approved/rejected, evidenceUrl, reviewedBy |

### 2.2 Profiles (1:1 per role, created at signup)

| Model | Fields |
|---|---|
| **StudentProfile** | fullName, department, course, year, university, bio, cgpa, githubUrl, linkedinUrl, portfolioUrl, lookingFor (jsonb) |
| **ProfessorProfile** | fullName, department, designation, expertise (string[]), bio, officeContact, mentorshipAvailable |
| **ResearcherProfile** | fullName, researcherType (phd/postdoc/research_associate/research_assistant/faculty), department, bio, currentAvailability |
| **PrivacySettings** | 11 visibility fields — profile, email, phone, academic, cgpa, projects, research, socialLinks, connections, activity, contact — each `public \| university_only \| connections_only \| private` |

### 2.3 Research domain

| Model | Purpose |
|---|---|
| **ResearchTopic** | name, slug, description, parent/child topics, full-text search_vector |
| **ResearchTeam** | name, description, piUserId (leader), createdBy |
| **ResearchTeamTopic** | team ↔ topic link |
| **UserResearchTopic** | user interest link (composite PK) — powers interests + portfolio |
| **Publication** | title, abstract, journalOrConference, publishedDate, doi, externalUrl, pdfUrl |
| **PublicationAuthor** | author link with `author_order` (display order) |
| **PublicationTopic** | publication ↔ topic link |

### 2.4 Projects & collaboration

| Model | Purpose |
|---|---|
| **Project** | name, **visibility** (reuses Visibility enum, D-024), status (idea/planning/development/beta/active/completed/archived), problemStatement, solutionDescription, description, github/demo/docs URLs, createdBy |
| **ProjectMember** | accepted membership (composite PK projectId+userId), roleOnProject — the single source of member counts |
| **ProjectSkillNeeded** | skill + roleNeeded (composite PK includes role — same skill can be needed under multiple buckets) |
| **ProjectTopic** | project ↔ research topic |
| **JoinRequest** | **ONE mechanism** for requests AND invitations, projects AND research teams: userId + nullable projectId/researchTeamId + direction (request/invitation) + status (pending/accepted/rejected) + message |
| **Membership** | research-team membership (userId, organizationId?, researchTeamId?, role: member/leader/advisor/founder/pi) |

### 2.5 Organizations, events, opportunities, social

| Model | Purpose |
|---|---|
| **Organization** | type (club/society/startup), slug, category, facultyAdvisor, creator, StartupDetails |
| **Membership** | org positions (member/leader/advisor/founder/pi) |
| **Event** / **EventParticipant** | university events + attendance |
| **Opportunity** / **Application** | postings + applications |
| **Connection** | requester/addressee with status |
| **Follow** | followee/follower |

### 2.6 Communication

| Model | Purpose |
|---|---|
| **Conversation** | type (direct/group/project/research_team/club) + nullable projectId/researchTeamId/organizationId |
| **ConversationParticipant** | composite PK + **lastReadAt** (real unread state) |
| **Message** | conversationId, senderId, body, attachmentUrl, invitationType/invitationRefId (invitations can ride on messages), sentAt |
| **Notification** | userId, type (10 values), payload (jsonb), readAt — real domain events; also the dashboard activity source |
| **NotificationPreferences** | 10 per-category toggles |
| **Skill** / **UserSkill** | skill catalog + user links (composite PK, proficiency) |
| **Report** | moderation reports (status, action, reviewer) |

---

## 3. API (19 route groups under `/api/v1`)

Canonical conventions: Zod validation, `requireAuth` (Bearer) / `optionalAuth`, canonical error shape `{ error: { code, message, fields? } }`, cursor pagination `{ data, nextCursor }`, privacy-filtered responses (fields omitted entirely — never null, never masked).

### 3.1 Auth — `/auth`
| Endpoint | Behavior |
|---|---|
| `POST /auth/signup` | Creates User + role profile + PrivacySettings atomically; status `pending_verification`; sends verification email (non-fatal if provider down) |
| `POST /auth/verify-email` | Sets university verification by email-domain match; issues tokens |
| `POST /auth/login` | accessToken + refresh cookie (httpOnly, path-scoped); suspended/banned blocked |
| `POST /auth/refresh` | New accessToken via httpOnly cookie |
| `GET /auth/me` | Thin identity (id/email/role/status) from `findByIdLean` |
| `POST /auth/logout` · `POST /auth/forgot-password` · `POST /auth/reset-password` | Standard flows |

### 3.2 Users, profile, privacy — `/users`
| Endpoint | Behavior |
|---|---|
| `GET /users/:username` | Full profile, **privacy-filtered per viewer** (D-004: unauthorized fields omitted entirely); includes composed `portfolio` |
| `GET /users/me` | Own profile, owner view (JWT carries no username — canonical self-address) |
| `PATCH /users/me/profile` | Role-aware profile upsert (student/professor/researcher) |
| `GET/PATCH /users/me/privacy` | PrivacySettings |
| `GET /users/me/onboarding` · `POST /users/me/onboarding/complete` | Onboarding marker (`onboarding_completed_at`, D-023) |
| `GET /users/me/verification` · `POST /users/me/verification` | Verification status / request (existing Verification model; students rely on university email — D-003 auto-granted) |
| `POST /users/me/skills` · `GET/PATCH /users/me/privacy` | Skills + preferences |
| `GET /users/me/join-requests` · `PATCH /users/me/join-requests/:requestId/accept\|decline` | My pending requests + invitations (accept → real membership) |
| `POST /users/me/interests` · `DELETE /users/me/interests/:topicId` | Research-interest links (existing user_research_topics table) |

### 3.3 Projects — `/projects`
| Endpoint | Behavior |
|---|---|
| `GET /projects` · `GET /projects/:id` | List (status/skill/topic filters) + detail with creator, **real members** (avatar/username/roleOnProject), skills, topics |
| `POST /projects` | Any authenticated user (students/researchers/professors) |
| `PATCH /projects/:id` · `DELETE /projects/:id` | Creator-only (service checks `createdBy`) |
| `PATCH /projects/professor/:id/status` · `/members` CRUD | Professor management endpoints (ownership middleware) |
| `POST /projects/:id/join-requests` | **Request to join** → pending + creator notification; duplicates → 409 |
| `GET /projects/:id/join-requests` | Creator-only pending list (server-authorized) |
| `PATCH /projects/:id/join-requests/:requestId/accept\|reject` | Accept **creates the real `project_members` row** (transaction); reject does not; both notify |
| `POST /projects/:id/invitations` | Creator invites → pending invitation + invitee notification |
| `POST /:id/join` · `/:id/leave` · `/:id/matches` | Legacy join + matching |

### 3.4 Research — `/research-topics`, `/research-teams`, `/publications`
Professor CRUD/lifecycle on topics; team CRUD + member management; publication CRUD with author management; `POST /research-teams/:id/join-requests` (+ list/accept/reject) — the same JoinRequest mechanism.

### 3.5 Messaging — `/conversations`
| Endpoint | Behavior |
|---|---|
| `GET /conversations` | Participant-only list with **real unread** (caller's `lastReadAt` included) |
| `POST /conversations/direct` | **THE one open-or-create** for direct conversations (findExistingDirect de-dup — repeated clicks never create duplicates) |
| `GET/POST /conversations/:id/messages` | History (paginated) + send (participant-only, server-determined sender) |
| `GET /conversations/:id/stream` | **SSE realtime delivery** — participant-only; token via `?token=` validated with the same `verifyAccessToken` (EventSource cannot send headers); messages pushed as JSON events |
| `POST /conversations/:id/read` | Marks read (sets `lastReadAt`; refresh-safe) |

### 3.6 Notifications, connections, search, discover, admin
| Endpoint | Behavior |
|---|---|
| `GET /notifications` (unreadOnly) · `PATCH /:id/read` · `PATCH /read-all` | Real notification center; read state is DB state |
| `GET/PATCH /users/me/privacy`, connections CRUD, follow | Social graph |
| `GET /search?q=&types=` | Federated full-text search (people/projects/research/publications/teams/clubs/startups/events/opportunities); real usernames, name+expertise matching, `matched` reason; never UUIDs/timestamps |
| `GET /discover` | Recommendations (real relationship/skill data — no fake percentages) |
| `GET /admin/verifications` (evidence + requester email) · `PATCH /admin/verifications/:id` · reports CRUD · metrics | **requireRole(["admin"])** — approve/reject updates real state |

---

## 4. Authorization Model

Server-side only — the frontend never decides.

| Role | Capabilities |
|---|---|
| **VIEWER** | Sees what privacy/visibility permits |
| **REQUESTER** | Can request to join (pending, not a member) |
| **MEMBER** | Member-level workspace access (real membership row) |
| **CREATOR / LEADER (PI)** | Manages THEIR entity: edit, status, members, requests, invitations. Ownership = `createdBy` / `piUserId` — enforced in services |
| **PROFESSOR (verified)** | Professor CRUD on research entities they own; verified via Verification model (admin-approved) + university email. **Not an admin** |
| **ADMIN** | Platform-level: verification review, moderation, metrics. `requireRole(["admin"])`. Verified professor ≠ admin; org president ≠ admin |

**Middleware stack:** `requireAuth` (Bearer + DB user lookup, suspended/ban blocked) · `requireRole` (D-003: privileged roles need approved Verification; student/alumni auto-granted) · `requireProfessorVerified` (6 eligibility checks) · `requireProfessorOwnership` / `requireResearchOwnership` (entity ownership per type) · `optionalAuth`.

---

## 5. Privacy Enforcement (D-004)

`privacyService.filterProfileForViewer(profile, privacy, viewerContext)`:
1. Owner/admin see everything.
2. Profile-invisible viewer → minimal stub (id/username/role/status only).
3. Per-field checks: email → `emailVisibility`, phone → `phoneVisibility`, cgpa → `cgpaVisibility`, academic → `academicVisibility`, social links → `socialLinksVisibility`.
4. Portfolio sections filtered the same way: projects → `projectsVisibility`, teams/topics/publications → `researchVisibility`, organizations → `activityVisibility`, skills → `academicVisibility`.
5. Unauthorized fields are **omitted from the JSON entirely** (absent, not null) — enforced server-side; the frontend never hides anything itself.
6. Embedded nested-user selects use `SAFE_USER_SELECT` (id/username/avatarUrl/requestedRole) — `passwordHash` can never leak; admin endpoints use `SAFE_USER_SELECT_ADMIN` (+email, guarded by a D-019 regression test).
7. Viewer context: `isUniversityMember`, `isConnected`, `isAdmin` from real Connection rows.

---

## 6. Feature Documentation

### 6.1 Authentication & Onboarding
- **Signup** → atomic creation of User + role profile + privacy settings → email verification → login.
- **Onboarding** (`/onboarding`): role-aware, 6-step profile builder (Welcome → About → Skills → Interests → Existing work → Preview). Draft state lives at the component level — **Back never loses values**; Skip saves what's typed (idempotent upserts); existing data prefilled, never re-asked; the platform's known relationships shown read-only ("Your existing work"). Completion marker: `users.onboarding_completed_at` (single nullable timestamp — D-023). **Resume:** AppLayout's OnboardingGuard redirects incomplete users to `/onboarding` on any authenticated page. Completing twice is impossible (service only sets it once).

### 6.2 Portfolio (living, composed — D-023 §2)
- `GET /users/:username` / `GET /users/me` include a **server-composed `portfolio`**: projects (Lead/Member), research teams (PI/Member), publications (author_order), organizations (Member/Founder), skills (with proficiency), research topics.
- **Never stored** — derived from real relationships on every read; joins a project → appears automatically.
- **PortfolioView** (shared component): hero (avatar, name, username, verified badge, role-derived subtitle), About, Skills/Expertise (role-aware: professors get an Expertise section), Research (interests as topic links, teams with PI badge, publications), Projects, Organizations, Collaboration (mentorship/availability/lookingFor), Links. Useful empty states ("Create a project or join a team to showcase your work here").
- **My Portfolio** (`/me`): owner view + inline editing (PATCH /users/me/profile) + VerificationPanel.

### 6.3 Projects (workspace, not CRUD cards)
- **Project detail**: header (name, description, creator link, status pill, member count from real rows), creator controls (Edit / Invite), **About sections** (The problem / What we're building), Skills & technologies, Research topics (linked), **Team** (real member cards: avatar/initials, username, roleOnProject, profile link, Lead badge), **Requests to join** (creator-only), links.
- **Join-request workflow**: Request to Join → pending (creator notified `team_recruitment`) → creator Reviews (requester profile link, message, date) → Accept creates the real membership row (transaction) → requester notified (`project_request_accepted`) → project appears in My Projects + portfolio. Duplicates → 409. Reject → no membership.
- **Invitation workflow**: creator Invite → pending invitation + `project_invitation` notification → invitee Accept/Decline (My Projects pending + notification actions) → Accept creates real membership. Never silently turns invitation into membership.
- **Visibility** (D-024): `projects.visibility` reuses the existing Visibility enum (public default). VISIBILITY ≠ MEMBERSHIP: visibility governs discovery; `project_members` governs access/management.

### 6.4 My Projects (`/my-projects`, sidebar link)
- **Leading** (created/led) · **Member** (accepted) — from the composed portfolio · **Pending** (real JoinRequest rows, both directions) with inline Accept/Decline for invitations. Empty states with next actions.

### 6.5 Research
- Topics: professor CRUD + lifecycle, hub pages with relationships; user interests link into the portfolio and search.
- Teams: PI/creator management, same join-request mechanism, real member counts.
- Publications: author management with `author_order`, topic links, portfolio integration.

### 6.6 Messaging & Realtime (D-024 §4)
- **Message is a first-class action everywhere**: `MessageButton` on profiles, project member cards; Messages → New Message (username search → direct conversation). All paths converge on `POST /conversations/direct` (de-duplicated).
- **Messages page** (`/messages?c=<id>` deep link): two-column layout — conversation list (avatar, title, last message, relative time, unread dot) + conversation pane (**header**: avatar, name, role, View Profile; **history**; **composer** with auto-focus, Enter-to-send, whitespace rejection).
- **Realtime**: SSE stream per conversation (participant-only; `?token=` validated server-side) — new messages appear without refresh; EventSource auto-reconnect + "Reconnecting…" state + refetch on reopen.
- **Honest delivery**: draft preserved on failure → "Message couldn't be sent." + Retry — never a fake "Sent".
- **Unread/read**: `ConversationParticipant.lastReadAt` set on open; unread derived from real message timestamps; persists across refresh.
- **De-duplication**: one direct conversation per user pair (findExistingDirect).
- **Authorization**: every conversation read/write/stream is participant-checked server-side; sender identity from the token, never the client.

### 6.7 Notifications & Activity
- Real events → real notifications (existing `NotificationType` values): connection_request, new_message, project_invitation, research_invitation, team_recruitment (join request/accept/member joined), profile_interaction (verification approved, request rejected), new_publication, club_announcement, event_reminder, opportunity_deadline.
- Titles built from the actual payload; **actionable items** (Review for join requests, Accept/Decline for invitations) wired to real endpoints.
- Read state is DB state (`PATCH /:id/read`, `PATCH /read-all`); refresh-safe.
- **Dashboard Recent Activity = the caller's real notifications** (fake hardcoded activity removed) — same events, user-centric view.

### 6.8 Verification
- States: Not verified → "Request verification" (evidence URL) → Pending ("An administrator is reviewing your request") → **Verified badge** (server-authoritative) → Rejected → resubmit allowed.
- Admin queue (`requireRole(["admin"])`): requester, email, role, submitted date, "View evidence ↗", Approve/Reject. D-019 regression test guards SAFE_USER_SELECT.

### 6.9 Search & Discover
- **Global federated search** (9 types, grouped results): people (name/username ILIKE prefix-ranked + profile full-text + expertise with `matched` reason), projects (name + search_vector + creator), topics, publications, teams, orgs, events, opportunities. No UUIDs/timestamps/enum garbage.
- **Discover**: people cards with match reason from real skills/interests; empty states guide users to add skills.

### 6.10 Admin
- Verification queue (real requests, evidence), moderation reports (restrict/ban actions), platform metrics. All `requireRole(["admin"])`; professors never gain admin.

---

## 7. UI/UX Design System

- **Tokens**: `styles/tokens.css` — single source of truth; Tailwind maps every color to CSS variables; dark mode via `.dark` class (AppLayout toggle); both themes intentional.
- **Components**: ProfileHeader, PortfolioView, MessageButton, MessagePanel, NotificationPanel, Modal (token-based overlay), ProjectCard, SkillBadge, VerificationBadge, EmptyState, ErrorState, Skeleton, Toast, PrivacyControls, Timeline, FilterPanel.
- **Patterns** (inspired by, never copied): LinkedIn identity+actions on people · Freelancer actionable notifications/requests · Slack/Teams two-column messaging with professional density · Notion-style clean hierarchy.
- **States everywhere**: loading skeletons, honest success (never before backend confirmation), useful errors with retry, contextual empty states with next actions.
- **Responsive**: desktop two-column messages, mobile conversation-with-back-nav; token spacing/typography consistent across all 23 page groups.

---

## 8. Engineering Decisions (DECISIONS.md highlights)

| Decision | Summary |
|---|---|
| **D-013** | Server-generated usernames (email local-part, de-duplicated) |
| **D-018** | `phone` column + `phone_visibility` enforcement |
| **D-019** | SAFE_USER_SELECT guards nested-user leaks (regression-tested) |
| **D-022** | Professor permission model implementation |
| **D-023** | Portfolio = composed view (no table); onboarding = one nullable timestamp; onboarding runs post-login (no bypass) |
| **D-024** | Project visibility reuses Visibility enum; ONE `join_requests` table (both directions, both domains); Recent Activity = notifications; SSE realtime |

---

## 9. Testing

- **11 node:test suites** — auth lifecycle/tokens/routes, error handling, privacy enforcement (D-004 + D-018 regressions), requireRole (D-003), Phase-5 resource guards (47 subtests), server/health, admin/verification integration (D-019 regressions).
- **Full-journey verification performed live** (two real authenticated accounts): signup → onboarding → portfolio → skills → project creation → request to join → creator notification → review → accept → **real membership row** → My Projects → notification → SSE message delivery without refresh → reply → persistence after refresh → mark-read → unread derivation → de-duplicated direct conversations.
- Commands: `pnpm typecheck` (4/4 packages) · `pnpm lint` (0 errors) · `pnpm --filter @app/api test` (all suites `# fail 0`).

---

## 10. Running the Project

```bash
pnpm install                 # deps
pnpm --filter @app/api exec prisma migrate deploy   # schema
pnpm dev                     # API :4000 + Web :5173 (turbo)
pnpm typecheck && pnpm lint && pnpm --filter @app/api test
```

Environment (`apps/api/.env`): `DATABASE_URL` (PostgreSQL), `CORS_ALLOWED_ORIGINS`, JWT secrets, SMTP (optional — signup tolerates provider failure).

---

## 11. Remaining / Known Gaps

- Research-topic hub aggregation (related projects/people on the topic detail endpoint) — relationships exist, endpoint composition pending.
- Project/research-team chat entry points in workspace UI (models + membership checks already support it).
- Per-conversation unread **count** (currently boolean dot) and message "load older" pagination in the UI.
- Notification unread badge in the Navbar (real count available via API).

---
---

# 🚀 Elevator Pitch

**University Collaboration Network** turns a scattered campus — students hunting for projects, professors hunting for collaborators, research lost in silos — into **one living collaboration graph**.

Sign up, and a role-aware onboarding builds your professional portfolio in minutes: your skills, your interests, your department — and everything you do on the platform afterwards flows into it automatically. Join a project? It's on your portfolio. Lead a research team? It's there. Publish a paper? It's there.

Discovery works the way a university should: search "machine learning" and find the professors with that expertise, the teams working on it, the projects that need it — with reasons, not random results. See someone interesting? **Message** them right there — from their profile, from a project member card, from search — one click opens a real conversation with realtime delivery. Need people for your project? Set what you're building and what skills you need; interested students request to join, you review them with full context, and acceptance creates real membership — visible in your team, their portfolio, and both of your notifications.

Everything respects the academic hierarchy: students, researchers, and verified professors lead the work they own — while admins quietly keep the platform trustworthy through verification and moderation. Privacy is enforced server-side, field by field: a professor's contact details reach the right people, and nobody else.

**It's LinkedIn's professional identity, Freelancer's actionable workflow, and Slack's collaboration — rebuilt as one university platform, on real data, with real permissions, and not a single fake number on the screen.**

For the student: *find where you belong.* For the professor: *find who you're looking for.* For the university: *see the whole graph finally connected.*

**University Collaboration Network — your campus, finally working as one network.**
