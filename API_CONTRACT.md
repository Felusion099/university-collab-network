# API_CONTRACT.md

Base path: `/api/v1`. All responses JSON. All error responses use the shared error shape (see §0). This file is the single source of truth for request/response shapes — frontend and backend agents must not invent competing formats. Full request/response types are mirrored as Zod schemas in `packages/shared-types` (owned by Phase 3, consumed by Phases 5 & 7).

## 0. Shared Conventions

**Error format (every non-2xx response):**
```json
{ "error": { "code": "STRING_ENUM_CODE", "message": "human readable", "fields": { "email": "Invalid email format" } } }
```
`fields` is omitted unless it's a validation error (422).

**Pagination (every list endpoint):**
Query: `?cursor=<opaque>&limit=<int, default 20, max 100>`
Response: `{ "data": [...], "nextCursor": "string|null" }`

**Auth header:** `Authorization: Bearer <access_token>` on all non-public routes.

**Standard status codes:** `200` ok, `201` created, `204` no content, `400` bad request, `401` unauthenticated, `403` unauthorized (authenticated but not allowed), `404` not found, `409` conflict, `422` validation error, `429` rate limited, `500` server error.

---

## 1. Auth — `/api/v1/auth` (Phase 4 owns)

### POST `/auth/signup`
Auth: none.
Request: `{ "email": string, "password": string, "fullName": string, "requestedRole": "student"|"professor"|"researcher"|"club_rep"|"startup_member"|"alumni" }`
Response `201`: `{ "userId": string, "status": "pending_verification" }`
Errors: `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR`.

### POST `/auth/verify-email`
Auth: none. Request: `{ "token": string }` → Response `200`: `{ "verified": true, "isUniversityVerified": bool }`

### POST `/auth/login`
Auth: none. Request: `{ "email": string, "password": string }`
Response `200`: `{ "accessToken": string, "user": { "id", "email", "role", "status" } }` + sets `refresh_token` httpOnly cookie.
Errors: `401 INVALID_CREDENTIALS`, `403 ACCOUNT_SUSPENDED`.

### POST `/auth/refresh`
Auth: refresh cookie. Response `200`: `{ "accessToken": string }`, rotates cookie.

### GET `/auth/me`
Auth: required. Resolves HANDOFF-21 — lets the frontend re-hydrate the full `user` object after a page reload restores `accessToken` via `POST /auth/refresh` but has no user data to go with it.
Response `200`: `{ "id", "email", "role", "status" }` — the same `AuthenticatedUserSchema` shape `POST /auth/login` returns under its `user` key, returned directly (not nested).
Errors: `401 UNAUTHENTICATED` (missing/invalid/expired access token), `403 ACCOUNT_SUSPENDED`.

### POST `/auth/logout`
Auth: required. Revokes refresh token. Response `204`.

### POST `/auth/forgot-password` → `{ "email": string }` → `200 { "sent": true }` (always 200, never reveals whether email exists).

### POST `/auth/reset-password` → `{ "token": string, "newPassword": string }` → `200 { "reset": true }`

---

## 2. Profile & Privacy — `/api/v1/users` (Phase 5 owns, Phase 4 owns auth checks)

### GET `/users/:username`
Auth: optional (public profiles readable logged-out). Role required: none, but response is **filtered by viewer context** per DECISIONS D-004.
Response `200`: full profile object, with any field the viewer isn't authorized for **omitted from the JSON entirely** (not null, not masked — absent).

### PATCH `/users/me/profile` — auth required, owner only.
### GET/PATCH `/users/me/privacy` — auth required, owner only. Body shape mirrors `privacy_settings` table columns.

---

## 3. Resource Convention (applies to the remaining entity groups)

Unless overridden below, every resource group follows this pattern — later phases must not deviate without a `DECISIONS.md` entry:

```
GET    /api/v1/{resource}            list (paginated, filterable via query params)
GET    /api/v1/{resource}/:id        detail
POST   /api/v1/{resource}            create (auth + role required per table)
PATCH  /api/v1/{resource}/:id        update (auth + ownership/role required)
DELETE /api/v1/{resource}/:id        soft-delete where applicable (auth + ownership/role required)
```
Resources following this convention: `projects, research-teams, research-topics, publications, organizations` (filtered by `?type=club|society|startup`), `events, opportunities, skills`.

Filter query params by resource (non-exhaustive, extend via docs not silent code):
- `/projects?status=&skill=&topic=&lookingFor=`
- `/organizations?type=&category=`
- `/opportunities?type=&department=&deadlineBefore=&skill=`
- `/research-topics/:slug` includes nested `researchers, professors, students, teams, projects, publications, relatedTopics, openProblems, opportunities, events` per spec §11.

---

## 4. Search — `/api/v1/search` (Phase 5 owns)

### GET `/search?q=&types=&filters=`
Auth: required (search results respect privacy same as profile reads).
`types` = comma-separated subset of `people,projects,research,publications,teams,clubs,startups,events,opportunities`.
Response `200`:
```json
{
  "people": [ { "id","username","name","role","department","matchedOn":[...] } ],
  "projects": [...],
  "research": [...],
  "publications": [...],
  "teams": [...],
  "organizations": [...],
  "events": [...],
  "opportunities": [...]
}
```
Each category capped at `limit` (default 5) with a `seeAllUrl`; never one flat array (spec §7).

---

## 5. Team-Builder / Matching — `/api/v1/projects/:id/matches` (Phase 5 owns, logic in Phase 3 `matching.service.ts`)

### GET `/projects/:id/matches`
Auth: required, project owner/member only.
Response `200`:
```json
{
  "data": [
    {
      "userId": "string",
      "matchScore": 92,
      "matchedCriteria": ["Python", "Machine Learning", "Data Science", "Interested in transportation AI"],
      "unmatchedCriteria": ["React"]
    }
  ]
}
```
Never return a bare score with no `matchedCriteria` — this is a spec requirement (§15), not a nicety.

---

## 6. Connections & Messaging — `/api/v1/connections`, `/api/v1/conversations` (Phase 5 owns)

- `POST /connections` → `{ "addresseeId", "message" }` (the "why connect" text, required, per spec §20).
- `PATCH /connections/:id` → `{ "status": "accepted"|"declined"|"blocked" }`
- `GET /conversations` → list of conversation summaries.
- `GET /conversations/:id/messages?cursor=` → paginated messages, newest-first cursor.
- `POST /conversations/:id/messages` → `{ "body", "attachmentUrl"?, "invitationType"?, "invitationRefId"? }`
- `POST /conversations` → `{ "type", "participantIds", "projectId"?|"researchTeamId"?|"organizationId"? }` create or fetch-existing direct conversation.

---

## 7. Notifications — `/api/v1/notifications` (Phase 5 owns)
`GET /notifications?unreadOnly=` · `PATCH /notifications/:id/read` · `GET/PATCH /notifications/preferences`

---

## 8. Discover — `/api/v1/discover` (Phase 5 owns)
`GET /discover` → same shape as §4 search response, but query-less and personalized; every item includes a `reason` string (spec §23: "explain why recommendations appear").

---

## 9. Admin — `/api/v1/admin/*` (Phase 5 owns, `requireRole(['admin'])` on every route)
`GET /admin/verifications?status=pending` · `PATCH /admin/verifications/:id` (`{ "status": "approved"|"rejected" }`)
`GET /admin/reports?status=open` · `PATCH /admin/reports/:id` (`{ "status", "action": "none"|"restrict"|"suspend"|"ban" }`)
`GET /admin/metrics` → aggregate counts per spec §25 (users, active users, projects, teams, publications, orgs, startups, events, **collaborations formed** — not vanity metrics, per §42).

---

## Ownership
This file is created in Phase 0 and **owned/extended by Phase 5** (API Endpoints) as concrete route handlers are implemented. Any endpoint not yet listed here must be documented here *before* being coded, not after.
