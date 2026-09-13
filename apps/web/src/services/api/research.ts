import { apiFetch } from "./client";

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

/* Backend row mapping — list rows carry _count rollups + parentTopic name
 * (added to researchTopic.repository.ts list include); the detail
 * (getBySlug) response embeds the relations directly, so counts are read
 * from the arrays when present and fall back to _count for list rows. */
function mapTopic(raw: Record<string, unknown>): ResearchTopicSummary {
  const parent = raw.parentTopic as { name?: string } | null | undefined;
  const count = raw._count as { researchTeamTopics?: number; publicationTopics?: number } | undefined;
  const teamTopics = raw.researchTeamTopics as unknown[] | undefined;
  const pubTopics = raw.publicationTopics as unknown[] | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    description: (raw.description as string | null) ?? null,
    parentTopicName: parent?.name ?? null,
    teamCount: teamTopics ? teamTopics.length : (count?.researchTeamTopics ?? 0),
    publicationCount: pubTopics ? pubTopics.length : (count?.publicationTopics ?? 0),
  };
}

export const researchApi = {
  list: async (
    params: ResearchTopicListParams,
  ): Promise<{ data: ResearchTopicSummary[]; nextCursor: string | null }> => {
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit) search.set("limit", String(params.limit));
    const page = await apiFetch<{ data: Record<string, unknown>[]; nextCursor: string | null }>(
      `/research-topics${search.toString() ? `?${search.toString()}` : ""}`,
    );
    return { data: page.data.map(mapTopic), nextCursor: page.nextCursor };
  },

  getBySlug: async (slug: string): Promise<ResearchTopicSummary | null> => {
    try {
      const raw = await apiFetch<Record<string, unknown>>(`/research-topics/${slug}`);
      return mapTopic(raw);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },
};
