import { apiFetch } from "./client";

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