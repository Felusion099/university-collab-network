import { apiFetch } from "./client";
import type { UserProfileResponse } from "@app/shared-types";
import type { UserRole } from "@app/shared-types";

/**
 * PROVISIONAL mock for `/admin/*` (API_CONTRACT.md §9, Phase 5-owned
 * routes, `requireRole(['admin'])` on every one). Same read-schema gap as
 * every other services/api/*.ts file this phase — additionally, the two
 * PATCH actions here (`updateVerification`, `updateReport`) don't persist
 * anywhere real; they mutate the in-memory mock array so the page feels
 * interactive, exactly the same "mocked but functional" pattern as every
 * other list page this session, not a new pattern invented for admin.
 *
 * Metrics deliberately mirror PROJECT_SPEC.md §42/§56's explicit
 * instruction: collaboration/activity counts, never vanity metrics
 * (no likes/followers/screen-time fields exist here at all, on purpose).
 */
export interface VerificationRequest {
  id: string;
  userName: string;
  requestedRole: "professor" | "researcher" | "club_rep" | "startup_member";
  submittedAt: string; // ISO date
  status: "pending" | "approved" | "rejected";
}

export interface Report {
  id: string;
  reportedName: string;
  reason: string;
  submittedAt: string; // ISO date
  status: "open" | "resolved";
  action: "none" | "restrict" | "suspend" | "ban";
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsersLast30Days: number;
  projects: number;
  researchTeams: number;
  publications: number;
  organizations: number;
  startups: number;
  events: number;
  collaborationsFormed: number;
}

export const adminApi = {
  getVerifications: (status?: string): Promise<{ data: VerificationRequest[] }> => 
    apiFetch<{ data: VerificationRequest[] }>(`/admin/verifications${status ? `?status=${status}` : ''}`),
  getOpenReports: (): Promise<{ data: Report[] }> => 
    apiFetch<{ data: Report[] }>("/admin/reports?status=open"),
  getMetrics: (): Promise<AdminMetrics> => 
    apiFetch<AdminMetrics>("/admin/metrics"),
  updateVerification: (id: string, status: "approved" | "rejected"): Promise<{ data: VerificationRequest }> => 
    apiFetch(`/admin/verifications/${id}`, { method: "PATCH", body: { status } }),
  updateReport: (id: string, action: Report["action"] | "none"): Promise<{ data: Report }> => 
    apiFetch(`/admin/reports/${id}`, { method: "PATCH", body: { action } }),
};

/**
 * PROVISIONAL mock for `/users` directory listing endpoint (HANDOFF-22).
 * 
 * There is no `GET /users?role=` (or equivalent) listing endpoint in
 * API_CONTRACT.md yet, and no read-response Zod schema for it in
 * `packages/shared-types` (that file only has Create/Update request
 * schemas today — confirmed by reading it in full before writing this).
 * Both are owned by other phases (5 and 3 respectively), so per
 * FILE_STRUCTURE.md's Module Ownership Rule this isn't edited here —
 * HANDOFF-22 records the proposed shape instead.
 * 
 * `DirectoryUserSummary` below is that proposed shape, trimmed from
 * `UserProfileResponseSchema` (packages/shared-types/src/user.ts) to what
 * a directory card actually renders. It is intentionally NOT exported from
 * `@app/shared-types` — it lives here, local to Phase 7, until Phase 3
 * formalizes it. Phase 8's job (per IMPLEMENTATION_STATUS.md) is to swap
 * this file's body for a real `apiFetch` call against the real endpoint;
 * every consumer (StudentsListPage, ProfessorsListPage, ResearchersListPage,
 * UserCard) only imports the type and the `directoryApi.list` function, so
 * that swap should require changing only that one file, not the pages or
 * `UserCard`.
 */
export interface DirectoryUserSummary {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  isUniversityVerified: boolean;
  /** Flattened from whichever role-profile is present server-side — e.g.
   * a student's `department + course`, a professor's `designation`. */
  headline: string | null;
  department: string | null;
  /** Capped preview; full list lives on the detail page. */
  topSkills: string[];
}

export interface DirectoryListParams {
  role: UserRole;
  department?: string;
  skill?: string;
  q?: string;
  cursor?: string | null;
  limit?: number;
}

export interface DirectoryListResponse {
  data: DirectoryUserSummary[];
  nextCursor: string | null;
}

export interface DirectoryUserDetail {
  id: string;
  username: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  isUniversityVerified: boolean;
  headline: string | null;
  department: string | null;
  bio: string | null;
  topSkills: string[];
  lookingFor: string | null;
  cgpa: number | null;
}

export const directoryApi = {
  /**
   * Real implementation of the HANDOFF-22 proposal — filters and
   * paginates real backend results, matching the documented response shape
   * (`{ data, nextCursor }`, cursor = plain numeric offset here since
   * there's no real backend to generate an opaque one) closely enough
   * that swapping in `apiFetch<DirectoryListResponse>(...)` later is a
   * same-shape drop-in.
   */
  list: async (params: DirectoryListParams): Promise<DirectoryListResponse> => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.q) query.set('q', params.q);
    const raw = await apiFetch<{
      data?: {
        id: string;
        username: string;
        requestedRole?: string;
        avatarUrl?: string | null;
        isUniversityVerified?: boolean;
        studentProfile?: { fullName?: string; department?: string };
        professorProfile?: { fullName?: string; department?: string };
      }[];
      nextCursor?: string | null;
    }>(`/users?${query.toString()}`);
    return {
      data: (raw.data ?? []).map((u) => ({
        id: u.id,
        username: u.username ?? 'unknown',
        fullName: u.username ?? 'Unknown',
        role: (u.requestedRole ?? 'student') as UserRole,
        avatarUrl: u.avatarUrl ?? null,
        isUniversityVerified: u.isUniversityVerified ?? false,
        headline: (u.studentProfile?.fullName ? u.studentProfile.fullName + ' — Student' : u.professorProfile?.fullName ? u.professorProfile.fullName + ' — Professor' : null),
        department: u.studentProfile?.department ?? u.professorProfile?.department ?? null,
        topSkills: [] as string[],
      })),
      nextCursor: raw.nextCursor ?? null,
    };
  },

  /** Mirrors GET /users/:username (API_CONTRACT.md §2, real endpoint —
   * not provisional) shape closely enough for the detail page mock. */
    /** Real GET /users/:username (API_CONTRACT.md §2) — the canonical,
   * privacy-filtered UserProfileResponse including the server-composed
   * portfolio view. Replaces the earlier flattened mock shape. */
  getByUsername: async (username: string): Promise<UserProfileResponse | null> => {
    try {
      return await apiFetch<UserProfileResponse>(`/users/${username}`);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },
};