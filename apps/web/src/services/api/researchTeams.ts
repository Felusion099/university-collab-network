/**
 * PROVISIONAL mock for GET /research-teams and GET /research-teams/:id —
 * already documented in API_CONTRACT.md §3, no new HANDOFF needed. Field
 * names mirror `CreateResearchTeamRequestSchema` exactly (`name`,
 * `description`, `topicIds` — represented here as `topicNames`, same
 * FK-resolution reasoning as `publications.ts`'s `authorNames`).
 * `piName`/`memberCount` are read-only rollups a card needs.
 */
export interface ResearchTeamSummary {
  id: string;
  name: string;
  description: string | null;
  piName: string;
  memberCount: number;
  topicNames: string[];
}

export interface ResearchTeamListParams {
  q?: string;
  cursor?: string | null;
  limit?: number;
}

const MOCK_TEAMS: ResearchTeamSummary[] = [
  {
    id: "team-1",
    name: "Iyer NLP Lab",
    description: "Working on low-resource machine translation and evaluation methods.",
    piName: "Dr. Radhika Iyer",
    memberCount: 4,
    topicNames: ["Natural Language Processing"],
  },
  {
    id: "team-2",
    name: "Materials Durability Group",
    description: "Corrosion-resistant coatings for marine and industrial applications.",
    piName: "Dr. Vikram Rao",
    memberCount: 3,
    topicNames: ["Materials Science — Corrosion Resistance"],
  },
];

export const researchTeamsApi = {
  list: async (
    params: ResearchTeamListParams,
  ): Promise<{ data: ResearchTeamSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_TEAMS;
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((t) => t.name.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<ResearchTeamSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_TEAMS.find((t) => t.id === id) ?? null;
  },
};
