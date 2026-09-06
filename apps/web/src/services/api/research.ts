/**
 * PROVISIONAL mock for GET /research (research topics) and
 * GET /research/:slug — already documented in API_CONTRACT.md §3's
 * generic convention, no new HANDOFF needed. Same read-schema gap as
 * every other services/api/*.ts file this phase. Field names mirror
 * `CreateResearchTopicRequestSchema` exactly (`name`, `description`,
 * `parentTopicId`), plus `slug` (DATABASE_SCHEMA.md: unique, used for the
 * `/research/:topic` route param) and a `teamCount`/`publicationCount`
 * rollup a directory card needs but the create schema doesn't carry.
 */
export interface ResearchTopicSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentTopicName: string | null;
  teamCount: number;
  publicationCount: number;
}

export interface ResearchTopicListParams {
  q?: string;
  cursor?: string | null;
  limit?: number;
}

const MOCK_TOPICS: ResearchTopicSummary[] = [
  {
    id: "rt-1",
    name: "Natural Language Processing",
    slug: "natural-language-processing",
    description: "Low-resource translation, evaluation, and dialogue systems.",
    parentTopicName: "Machine Learning",
    teamCount: 2,
    publicationCount: 3,
  },
  {
    id: "rt-2",
    name: "Materials Science — Corrosion Resistance",
    slug: "materials-corrosion-resistance",
    description: "Nanostructured coatings and long-term degradation testing.",
    parentTopicName: null,
    teamCount: 1,
    publicationCount: 1,
  },
  {
    id: "rt-3",
    name: "Robotics — Control Systems",
    slug: "robotics-control-systems",
    description: null,
    parentTopicName: "Robotics",
    teamCount: 1,
    publicationCount: 0,
  },
];

export const researchApi = {
  list: async (
    params: ResearchTopicListParams,
  ): Promise<{ data: ResearchTopicSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_TOPICS;
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((t) => t.name.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getBySlug: async (slug: string): Promise<ResearchTopicSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_TOPICS.find((t) => t.slug === slug) ?? null;
  },
};
