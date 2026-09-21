/**
 * Shared Prisma `select` shape for any nested `User` relation embedded
 * inside another resource's response (project creator/members, research
 * team PI/members, publication authors, conversation participants/sender,
 * connection requester/addressee, event participants, organization
 * memberships/faculty advisor, admin verification/report subjects, etc.).
 *
 * Added per the privacy-enforcement audit (master-prompt §6): every one of
 * these relations was previously fetched with a bare `{ user: true }` /
 * `{ creator: true }` / `{ pi: true }` (etc.) Prisma `include`, which pulls
 * *every* scalar column on `users` — including `password_hash`, `email`,
 * `phone` (D-018), and `university_domain` — and every one of those call
 * sites returns its result to `res.json()` with no field-level stripping in
 * between. That is a direct violation of DECISIONS.md D-004 ("private data
 * must never leak via API/frontend") for the single most sensitive column
 * in the entire schema. See DECISIONS.md D-019 for the full audit and fix.
 *
 * This is intentionally NOT the same thing as `privacy.service.ts`'s
 * viewer-aware field stripping (D-004) — that gates *profile* reads by
 * the viewer's relationship to the *subject* of the profile. This is a
 * lower, unconditional floor: no nested-user relation should ever surface
 * `passwordHash` (or other users-table columns not meant for third-party
 * display) to *any* caller, authenticated or not, regardless of viewer
 * context. Both layers are needed; this one guards the leak surface
 * `privacy.service.ts` was never wired into in the first place.
 */
export const SAFE_USER_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  requestedRole: true,
} as const;

/**
 * Slightly wider select for admin-only endpoints (`GET /admin/verifications`,
 * `GET /admin/reports`), where the caller is already `requireRole(['admin'])`
 * and genuinely needs `email` to identify/contact the account under review.
 * Still never includes `passwordHash`, `phone`, or `universityDomain`.
 */
export const SAFE_USER_SELECT_ADMIN = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  requestedRole: true,
  status: true,
} as const;
