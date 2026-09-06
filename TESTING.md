# TESTING.md

Tooling is frozen in `DEPENDENCIES.md` → "Testing (both apps)": Vitest (unit/integration), Supertest (API integration), `@testing-library/react` (component), Playwright (e2e). Full suite is implemented in **Phase 10**, but every phase's own acceptance criteria in `IMPLEMENTATION_STATUS.md` include a minimum smoke/test bar that must pass *before* Phase 10 — Phase 10 is where coverage becomes comprehensive, not where testing starts.

## 1. Philosophy

Test what breaks trust or correctness first, polish second. Priority order:
1. Privacy enforcement (a leak here is the single worst failure mode in this product).
2. Auth/authorization (role gating, verification-based access per D-003).
3. Core collaboration flows (matching, messaging, connections) doing what the spec promises, not just "not crashing."
4. Everything else.

## 2. Test Layers

| Layer | Tool | Runs against | Owned/expanded by |
|---|---|---|---|
| Unit | Vitest | Pure functions, services in isolation (mocked repositories) | Every phase touching `services/**` |
| API integration | Vitest + Supertest | Real Express app + test Postgres DB (migrated + seeded) | Phase 4 (auth), Phase 5 (resources), Phase 10 (full sweep) |
| Component | Vitest + Testing Library | Individual React components/pages, mocked API client | Phase 7 |
| E2E | Playwright | Full app, real API, seeded test DB, headless browser | Phase 10 |

Test DB is a separate database from dev, reset via `prisma migrate reset` + `seed.ts` before each integration/e2e run — tests never run against a developer's local dev data.

## 3. Mandatory Critical-Path Tests (minimum bar — not exhaustive)

**Privacy (D-004) — highest priority, non-negotiable:**
- For each `profile_visibility` level and each field-level `*_visibility` setting: assert the JSON response **omits the key entirely** for an unauthorized viewer (not `null`, not masked — absent). Run this for at least: stranger viewing a `private` profile, non-connection viewing a `connections_only` field, non-university viewer viewing a `university_only` field.
- Assert the same field IS present for an authorized viewer (owner, accepted connection, same-university viewer as applicable) — a test suite that only checks the negative case can hide a bug that blocks everyone.
- Assert search (`/search`) and directory list endpoints apply the same filtering as `/users/:username` — a common leak vector is a second endpoint that forgets the filter.

**Auth & Verification (D-003):**
- Happy path: signup → verify-email → login → refresh → logout.
- Wrong password → `401 INVALID_CREDENTIALS`; expired/invalid token → `401`.
- An account with `requested_role = professor` but no `approved` row in `verifications` is rejected by `requireRole(['professor'])` — the check must read `verifications.status`, never `requested_role` alone.
- Suspended/banned account cannot log in (`403 ACCOUNT_SUSPENDED`).

**Matching (spec §15):**
- Response always includes `matchedCriteria` and `unmatchedCriteria` alongside `matchScore` — a test asserting the bare-score-only shape should fail the build.

**Search (spec §7):**
- Response is grouped by category key (`people`, `projects`, `research`, ...), never a flat array.
- Pagination/limit per category is respected.

**Messaging:**
- Creating a `direct` conversation between the same two users twice returns the existing conversation, not a duplicate.
- Message pagination cursor doesn't skip or duplicate rows across pages.

**Admin (spec §25–26):**
- Every `/admin/*` route rejects non-admin roles with `403`.
- Approving a `verifications` row flips the user's badge-eligibility (verified by a subsequent profile read, not by inspecting internal state only).

## 4. Coverage Expectations

- `apps/api/src/services/**` (business logic, privacy filtering, matching, auth): high line coverage expected — this is where correctness bugs are most damaging and cheapest to catch.
- `apps/api/src/routes|controllers/**`: covered via integration tests (Supertest), not isolated unit tests of thin pass-through code.
- `apps/web/src/components/**`: interaction tests for stateful/critical components (forms, privacy controls, search); pure presentational components get lighter snapshot-style coverage.
- E2E (Playwright): one test per core user flow in `PROJECT_SPEC.md` §11 (Student, Researcher, Professor, Club, Startup, Private-Student, Admin) — these are the flows the whole product promises to deliver, so each needs an end-to-end proof, not just unit coverage of its parts.

No numeric global coverage percentage is mandated — a 100%-covered getter is worth less than one passing privacy-leak test. Phase 10 must show evidence (test output, not a claim) for every item in §3 before `IMPLEMENTATION_STATUS.md` marks it done, per the master prompt's "never say everything is complete unless verified" rule.

## 5. Commands (via Turborepo, once Phase 1 scaffolding exists)

```bash
pnpm test            # unit + integration, all packages, via turbo
pnpm test:e2e         # Playwright, requires app + API running against test DB
pnpm test --filter=api    # scope to apps/api
pnpm test --filter=web    # scope to apps/web
```
Exact scripts are wired in Phase 1 (`package.json`/`turbo.json`) and must match these names — do not invent different script names per package.

## 6. Ownership

This file is created in Phase 0. Each phase implements the tests its own acceptance criteria in `IMPLEMENTATION_STATUS.md` require as it goes (tests are not deferred wholesale to Phase 10). Phase 10 is responsible for: closing any gaps against §3 of this file, wiring CI, and producing the full E2E suite. Any test convention change (new tool, new required layer) goes through `DECISIONS.md`, not a silent addition here.
