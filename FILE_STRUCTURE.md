# FILE_STRUCTURE.md

## Monorepo Tree
```
/ (repo root)
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── DATABASE_SCHEMA.md
├── FILE_STRUCTURE.md
├── DEPENDENCIES.md
├── ENVIRONMENT.md
├── IMPLEMENTATION_STATUS.md
├── AGENT_HANDOFF.md
├── DECISIONS.md
├── TESTING.md
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
│
├── apps/
│   ├── web/                          → Phases 6, 7, 8
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes/               → route definitions (Phase 6)
│   │   │   ├── pages/                → one folder per route group (Phase 7)
│   │   │   │   ├── landing/
│   │   │   │   ├── auth/             (login, signup, forgot-password)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── discover/
│   │   │   │   ├── students/         (/students, /students/:username)
│   │   │   │   ├── professors/
│   │   │   │   ├── researchers/
│   │   │   │   ├── research/         (/research, /research/:topic)
│   │   │   │   ├── research-teams/
│   │   │   │   ├── projects/
│   │   │   │   ├── publications/
│   │   │   │   ├── clubs/
│   │   │   │   ├── startups/
│   │   │   │   ├── events/
│   │   │   │   ├── opportunities/
│   │   │   │   ├── messages/
│   │   │   │   ├── notifications/
│   │   │   │   ├── settings/         (includes privacy controls)
│   │   │   │   └── admin/
│   │   │   ├── components/           → shared design-system components (Phase 6, list in ARCHITECTURE §5)
│   │   │   ├── layouts/              (AuthLayout, AppLayout w/ Navbar+Sidebar)
│   │   │   ├── hooks/                → TanStack Query hooks, one per resource
│   │   │   ├── stores/               → Zustand stores (session, ui)
│   │   │   ├── services/api/         → typed fetch clients, one per resource, mirrors API_CONTRACT.md
│   │   │   ├── styles/tokens.css     → design tokens (Phase 6, owned, others must not hardcode values)
│   │   │   └── lib/                  (utils, formatters)
│   │   └── vite.config.ts
│   │
│   └── api/                           → Phases 2, 3, 4, 5
│       ├── prisma/
│       │   ├── schema.prisma          → OWNED BY PHASE 2 ONLY
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── src/
│       │   ├── server.ts
│       │   ├── routes/                → one file per resource group (Phase 5), thin — parse+delegate only
│       │   ├── controllers/           (Phase 5)
│       │   ├── services/              → business logic, incl. matching.service.ts, privacy filtering (Phase 3 + 4 + 5)
│       │   ├── repositories/          → Prisma queries isolated here, not scattered in services (Phase 2/3)
│       │   ├── middleware/            → requireAuth, requireRole, errorHandler, rateLimiter (Phase 4)
│       │   ├── validators/            → Zod schemas re-exported from packages/shared-types
│       │   └── utils/
│       └── tests/
│
├── packages/
│   ├── shared-types/                  → Zod schemas + TS types, mirrors API_CONTRACT.md (Phase 3 owns, all phases consume)
│   └── config/                        → eslint, tsconfig, prettier base configs (Phase 1 owns)
│
└── docker/                             → Phase 13
```

## Route → Owning Phase Map
| Route | Owning Phase |
|---|---|
| `/`, `/login`, `/signup` | 7 |
| `/dashboard` | 7 |
| `/discover` | 7 (backend: 5) |
| `/students`, `/students/:username` | 7 |
| `/professors`, `/professors/:username` | 7 |
| `/researchers`, `/researchers/:username` | 7 |
| `/research`, `/research/:topic` | 7 |
| `/research-teams`, `/research-teams/:id` | 7 |
| `/projects`, `/projects/:id` | 7 |
| `/publications`, `/publications/:id` | 7 |
| `/clubs`, `/clubs/:id` | 7 |
| `/startups`, `/startups/:id` | 7 |
| `/events`, `/events/:id` | 7 |
| `/opportunities`, `/opportunities/:id` | 7 |
| `/messages` | 7 |
| `/notifications` | 7 |
| `/settings` (incl. privacy) | 7 |
| `/admin/*` | 7 (backend: 5) |

## Module Ownership Rule
If Phase N needs to change a file owned by Phase M ≠ N: **stop**, record the required change and reason in `AGENT_HANDOFF.md`, do not edit the file. The next agent assigned to Phase M applies it.
