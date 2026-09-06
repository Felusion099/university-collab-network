import type { OpportunityType } from "@app/shared-types";

/**
 * PROVISIONAL mock for GET /opportunities and GET /opportunities/:id —
 * already documented in API_CONTRACT.md §3's generic convention, no new
 * HANDOFF needed. Same read-schema gap as projects.ts/events.ts. Field
 * names mirror `CreateOpportunityRequestSchema` exactly;
 * `OpportunityTypeEnum` is imported directly, not re-declared.
 *
 * `providerName` collapses `providedByOrganizationId`/
 * `providedByResearchTeamId` (mutually exclusive per the real schema's
 * `.refine`) into one display string — the mock doesn't need to model
 * the FK distinction, just show who's offering it.
 */
export interface OpportunitySummary {
  id: string;
  title: string;
  description: string | null;
  opportunityType: OpportunityType;
  providerName: string | null;
  deadline: string | null; // ISO date
  departmentTag: string | null;
}

export interface OpportunityListParams {
  opportunityType?: OpportunityType;
  departmentTag?: string;
  q?: string;
  cursor?: string | null;
  limit?: number;
}

const MOCK_OPPORTUNITIES: OpportunitySummary[] = [
  {
    id: "o-1",
    title: "Undergraduate Research Assistant — NLP Lab",
    description: "Help build evaluation datasets for a low-resource-language translation project.",
    opportunityType: "research_assistant",
    providerName: "Dr. Radhika Iyer's Lab",
    deadline: "2026-10-01",
    departmentTag: "Computer Science",
  },
  {
    id: "o-2",
    title: "Summer Internship — Renewable Energy Storage",
    description: "Paid internship testing battery chemistries for grid-scale storage.",
    opportunityType: "internship",
    providerName: "Materials Science Research Team",
    deadline: "2026-11-15",
    departmentTag: "Materials Science",
  },
  {
    id: "o-3",
    title: "Teaching Assistant — Intro to Algorithms",
    description: null,
    opportunityType: "teaching_assistant",
    providerName: "Computer Science Department",
    deadline: "2026-09-25",
    departmentTag: "Computer Science",
  },
  {
    id: "o-4",
    title: "Startup Co-founder — Campus Delivery Logistics",
    description: "Early-stage startup looking for a technical co-founder, equity only for now.",
    opportunityType: "startup",
    providerName: "Founders' Club",
    deadline: null,
    departmentTag: null,
  },
];

export const opportunitiesApi = {
  list: async (
    params: OpportunityListParams,
  ): Promise<{ data: OpportunitySummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_OPPORTUNITIES;
    if (params.opportunityType) {
      results = results.filter((o) => o.opportunityType === params.opportunityType);
    }
    if (params.departmentTag) {
      results = results.filter((o) => o.departmentTag === params.departmentTag);
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((o) => o.title.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<OpportunitySummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_OPPORTUNITIES.find((o) => o.id === id) ?? null;
  },
};
