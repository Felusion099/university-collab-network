import type { DirectoryUserSummary } from "./directory";

/**
 * PROVISIONAL mock for GET /discover and GET /search (API_CONTRACT.md §4,
 * §8 — Phase 5-owned, not yet implemented). Matches the documented
 * response shape (grouped by entity type, never a flat array — spec §7)
 * but this session only populates the `people` group with real card data;
 * `projects/research/publications/teams/organizations/events/opportunities`
 * are left as empty arrays rather than faked, since those entities' own
 * card components (ProjectCard, ResearchCard, etc. — ARCHITECTURE.md §5)
 * aren't built yet either. DiscoverPage only renders sections that have
 * results, so this doesn't show six empty "Projects (0)" headers.
 *
 * Isolated behind this one file per ARCHITECTURE.md §1's layering rule —
 * whoever builds the remaining card components and/or Phase 5's real
 * endpoint extends this file's shape, not DiscoverPage itself.
 */
export interface DiscoverResults {
  people: (DirectoryUserSummary & { reason: string })[];
  projects: unknown[];
  research: unknown[];
  publications: unknown[];
  teams: unknown[];
  organizations: unknown[];
  events: unknown[];
  opportunities: unknown[];
}

const MOCK_REASONS = [
  "Shares 2 skills with you",
  "In your department",
  "Works on a related research topic",
  "Recently joined a club you follow",
];

export const discoverApi = {
  /** GET /discover — query-less, "personalized" (spec §23 requires a
   * `reason` per item; mocked here with a small deterministic rotation
   * rather than real matching logic, which is Phase 3/5's job). */
  getRecommendations: async (): Promise<DiscoverResults> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const { directoryApi } = await import("./directory");
    const [students, professors, researchers] = await Promise.all([
      directoryApi.list({ role: "student", limit: 3 }),
      directoryApi.list({ role: "professor", limit: 2 }),
      directoryApi.list({ role: "researcher", limit: 2 }),
    ]);
    const people = [...students.data, ...professors.data, ...researchers.data].map((u, i) => ({
      ...u,
      reason: MOCK_REASONS[i % MOCK_REASONS.length]!,
    }));
    return {
      people,
      projects: [],
      research: [],
      publications: [],
      teams: [],
      organizations: [],
      events: [],
      opportunities: [],
    };
  },

  /** GET /search?q=&types= */
  search: async (query: string): Promise<DiscoverResults> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!query.trim()) {
      return {
        people: [],
        projects: [],
        research: [],
        publications: [],
        teams: [],
        organizations: [],
        events: [],
        opportunities: [],
      };
    }
    const { directoryApi } = await import("./directory");
    const [students, professors, researchers] = await Promise.all([
      directoryApi.list({ role: "student", q: query, limit: 5 }),
      directoryApi.list({ role: "professor", q: query, limit: 5 }),
      directoryApi.list({ role: "researcher", q: query, limit: 5 }),
    ]);
    const people = [...students.data, ...professors.data, ...researchers.data].map((u) => ({
      ...u,
      reason: `Matched "${query}"`,
    }));
    return {
      people,
      projects: [],
      research: [],
      publications: [],
      teams: [],
      organizations: [],
      events: [],
      opportunities: [],
    };
  },
};
