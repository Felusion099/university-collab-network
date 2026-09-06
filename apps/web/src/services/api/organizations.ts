import type { OrganizationType } from "@app/shared-types";

/**
 * PROVISIONAL mock for GET /organizations and GET /organizations/:id —
 * already documented in API_CONTRACT.md §3, no new HANDOFF needed. One
 * real backing table (`organizations`, DATABASE_SCHEMA.md) covers
 * club/society/startup via its `type` column — mirrors that: one service,
 * filtered by `type`, rather than three near-duplicate mock files.
 * Field names mirror `CreateOrganizationRequestSchema` exactly, including
 * the optional nested `startupDetails` (only present when
 * `type === "startup"`, matching the real schema's shape).
 */
export interface OrganizationSummary {
  id: string;
  type: OrganizationType;
  name: string;
  logoUrl: string | null;
  description: string | null;
  category: string | null;
  memberCount: number;
  startupDetails: {
    industry: string | null;
    stage: string | null;
    websiteUrl: string | null;
    hiring: boolean;
  } | null;
}

export interface OrganizationListParams {
  type: OrganizationType | OrganizationType[];
  q?: string;
  cursor?: string | null;
  limit?: number;
}

const MOCK_ORGS: OrganizationSummary[] = [
  {
    id: "org-1",
    type: "club",
    name: "Robotics Club",
    logoUrl: null,
    description: "Builds competition robots and hosts a demo day each semester.",
    category: "Engineering",
    memberCount: 22,
    startupDetails: null,
  },
  {
    id: "org-2",
    type: "society",
    name: "Computer Science Society",
    logoUrl: null,
    description: "Hosts hackathons, workshops, and the annual CS career fair.",
    category: "Computer Science",
    memberCount: 140,
    startupDetails: null,
  },
  {
    id: "org-3",
    type: "startup",
    name: "CampusConnect",
    logoUrl: null,
    description: "A study-group matching app spun out of a CS capstone project.",
    category: "EdTech",
    memberCount: 4,
    startupDetails: {
      industry: "Education Technology",
      stage: "Pre-seed",
      websiteUrl: "https://example.com/campusconnect",
      hiring: true,
    },
  },
  {
    id: "org-4",
    type: "startup",
    name: "GreenGrid Sensors",
    logoUrl: null,
    description: "Open-hardware air quality sensors, spun out of the Air Quality project.",
    category: "CleanTech",
    memberCount: 3,
    startupDetails: {
      industry: "Environmental Tech",
      stage: "Idea",
      websiteUrl: null,
      hiring: false,
    },
  },
];

export const organizationsApi = {
  list: async (
    params: OrganizationListParams,
  ): Promise<{ data: OrganizationSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;
    const types = Array.isArray(params.type) ? params.type : [params.type];

    let results = MOCK_ORGS.filter((o) => types.includes(o.type));
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((o) => o.name.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<OrganizationSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_ORGS.find((o) => o.id === id) ?? null;
  },
};
