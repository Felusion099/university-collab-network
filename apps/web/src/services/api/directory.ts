import type { UserRole } from "@app/shared-types";

/**
 * PROVISIONAL — see AGENT_HANDOFF.md HANDOFF-22.
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
 * that swap should not require touching any page or component.
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

// Deliberately deterministic (no Math.random) so loading states and
// pagination are actually exercisable/testable, not flaky.
const MOCK_USERS: DirectoryUserSummary[] = [
  {
    id: "u-1",
    username: "priya.sharma",
    fullName: "Priya Sharma",
    role: "student",
    avatarUrl: null,
    isUniversityVerified: true,
    headline: "B.Tech CSE, 3rd year",
    department: "Computer Science",
    topSkills: ["React", "Python", "Machine Learning"],
  },
  {
    id: "u-2",
    username: "arjun.mehta",
    fullName: "Arjun Mehta",
    role: "student",
    avatarUrl: null,
    isUniversityVerified: false,
    headline: "B.Sc Physics, 2nd year",
    department: "Physics",
    topSkills: ["MATLAB", "Data Analysis"],
  },
  {
    id: "u-3",
    username: "r.iyer",
    fullName: "Dr. Radhika Iyer",
    role: "professor",
    avatarUrl: null,
    isUniversityVerified: true,
    headline: "Associate Professor, Computer Science",
    department: "Computer Science",
    topSkills: ["Distributed Systems", "Networks"],
  },
  {
    id: "u-4",
    username: "k.nair",
    fullName: "Kiran Nair",
    role: "researcher",
    avatarUrl: null,
    isUniversityVerified: true,
    headline: "PhD Candidate, Materials Science",
    department: "Materials Science",
    topSkills: ["Nanomaterials", "XRD", "Data Analysis"],
  },
  {
    id: "u-5",
    username: "s.desai",
    fullName: "Sanjana Desai",
    role: "student",
    avatarUrl: null,
    isUniversityVerified: true,
    headline: "M.Tech AI, 1st year",
    department: "Computer Science",
    topSkills: ["PyTorch", "NLP", "React"],
  },
  {
    id: "u-6",
    username: "v.rao",
    fullName: "Dr. Vikram Rao",
    role: "researcher",
    avatarUrl: null,
    isUniversityVerified: false,
    headline: "Postdoctoral Researcher, Robotics",
    department: "Mechanical Engineering",
    topSkills: ["ROS", "Control Systems"],
  },
];

const PAGE_SIZE_DEFAULT = 20;

export const directoryApi = {
  /**
   * Mock implementation of the HANDOFF-22 proposal — filters and
   * paginates MOCK_USERS in-memory, matching the real response shape
   * (`{ data, nextCursor }`, cursor = plain numeric offset here since
   * there's no real backend to generate an opaque one) closely enough
   * that swapping in `apiFetch<DirectoryListResponse>(...)` later is a
   * same-shape drop-in.
   */
  list: async (params: DirectoryListParams): Promise<DirectoryListResponse> => {
    const limit = params.limit ?? PAGE_SIZE_DEFAULT;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_USERS.filter((u) => u.role === params.role);
    if (params.department) {
      results = results.filter((u) => u.department === params.department);
    }
    if (params.skill) {
      results = results.filter((u) => u.topSkills.includes(params.skill!));
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((u) => u.fullName.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;

    // Simulated network latency so the loading skeleton is actually
    // visible/verifiable rather than resolving instantly.
    await new Promise((resolve) => setTimeout(resolve, 350));

    return { data: page, nextCursor };
  },

  /** Mirrors GET /users/:username (API_CONTRACT.md §2, real endpoint —
   * not provisional) shape closely enough for the detail page mock. */
  getByUsername: async (username: string): Promise<DirectoryUserSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_USERS.find((u) => u.username === username) ?? null;
  },
};
