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

const verifications: VerificationRequest[] = [
  {
    id: "v-1",
    userName: "Dr. Ananya Gupta",
    requestedRole: "professor",
    submittedAt: "2026-09-01",
    status: "pending",
  },
  {
    id: "v-2",
    userName: "Rohan Kapoor",
    requestedRole: "club_rep",
    submittedAt: "2026-08-28",
    status: "pending",
  },
  {
    id: "v-3",
    userName: "Dr. Vikram Rao",
    requestedRole: "researcher",
    submittedAt: "2026-08-15",
    status: "approved",
  },
];

const reports: Report[] = [
  {
    id: "r-1",
    reportedName: "Startup: QuickNotes",
    reason: "Spammy messages sent to multiple students",
    submittedAt: "2026-09-02",
    status: "open",
    action: "none",
  },
  {
    id: "r-2",
    reportedName: "User: a.singh",
    reason: "Impersonating a professor",
    submittedAt: "2026-08-30",
    status: "resolved",
    action: "suspend",
  },
];

const metrics: AdminMetrics = {
  totalUsers: 1284,
  activeUsersLast30Days: 611,
  projects: 47,
  researchTeams: 12,
  publications: 38,
  organizations: 29,
  startups: 6,
  events: 21,
  collaborationsFormed: 356,
};

export const adminApi = {
  getVerifications: async (
    status: "pending" | "approved" | "rejected" = "pending",
  ): Promise<VerificationRequest[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return verifications.filter((v) => v.status === status);
  },

  updateVerification: async (
    id: string,
    status: "approved" | "rejected",
  ): Promise<VerificationRequest | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const item = verifications.find((v) => v.id === id);
    if (!item) return null;
    item.status = status;
    return item;
  },

  getReports: async (status: "open" | "resolved" = "open"): Promise<Report[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return reports.filter((r) => r.status === status);
  },

  updateReport: async (
    id: string,
    action: Report["action"],
  ): Promise<Report | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const item = reports.find((r) => r.id === id);
    if (!item) return null;
    item.action = action;
    item.status = "resolved";
    return item;
  },

  getMetrics: async (): Promise<AdminMetrics> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return metrics;
  },
};
