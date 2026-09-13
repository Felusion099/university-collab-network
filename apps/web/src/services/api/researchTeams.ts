import { apiFetch } from "./client";

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

/* Backend row mapping — list rows include pi (SAFE_USER_SELECT → username),
 * researchTeamTopics w/ nested topic, and a memberships _count rollup
 * (added to researchTeam.repository.ts list include). Detail rows embed
 * the memberships array directly. */
function mapTeam(raw: Record<string, unknown>): ResearchTeamSummary {
  const pi = raw.pi as { username?: string } | null | undefined;
  const topics = (raw.researchTeamTopics as { researchTopic?: { name?: string } }[] | undefined) ?? [];
  const memberships = raw.memberships as unknown[] | undefined;
  const count = raw._count as { memberships?: number } | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: (raw.description as string | null) ?? null,
    piName: pi?.username ?? "Unassigned",
    memberCount: memberships ? memberships.length : (count?.memberships ?? 0),
    topicNames: topics
      .map((t) => t.researchTopic?.name ?? "")
      .filter((n) => n !== ""),
  };
}

export const researchTeamsApi = {
  list: async (
    params: ResearchTeamListParams,
  ): Promise<{ data: ResearchTeamSummary[]; nextCursor: string | null }> => {
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit) search.set("limit", String(params.limit));
    const page = await apiFetch<{ data: Record<string, unknown>[]; nextCursor: string | null }>(
      `/research-teams${search.toString() ? `?${search.toString()}` : ""}`,
    );
    return { data: page.data.map(mapTeam), nextCursor: page.nextCursor };
  },

  getById: async (id: string): Promise<ResearchTeamSummary | null> => {
    try {
      const raw = await apiFetch<Record<string, unknown>>(`/research-teams/${id}`);
      return mapTeam(raw);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },
};
