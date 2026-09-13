import { apiFetch } from "./client";

export interface PublicationSummary {
  id: string;
  title: string;
  abstract: string | null;
  journalOrConference: string | null;
  publishedDate: string | null; // ISO date
  doi: string | null;
  externalUrl: string | null;
  pdfUrl: string | null;
  authorNames: string[]; // ordered per author_order
}

export interface PublicationListParams {
  q?: string;
  cursor?: string | null;
  limit?: number;
}

/* Backend row mapping — publication rows include authors w/ user
 * (SAFE_USER_SELECT → username) and topics; authorNames preserves
 * publication_authors.author_order per DATABASE_SCHEMA.md. */
function mapPublication(raw: Record<string, unknown>): PublicationSummary {
  const authors =
    (raw.authors as { authorOrder?: number; user?: { username?: string } }[] | undefined) ?? [];
  const sorted = [...authors].sort(
    (a, b) => (a.authorOrder ?? 0) - (b.authorOrder ?? 0),
  );
  const publishedDate = raw.publishedDate as string | null | undefined;
  return {
    id: String(raw.id),
    title: String(raw.title),
    abstract: (raw.abstract as string | null) ?? null,
    journalOrConference: (raw.journalOrConference as string | null) ?? null,
    publishedDate: publishedDate ? publishedDate.slice(0, 10) : null,
    doi: (raw.doi as string | null) ?? null,
    externalUrl: (raw.externalUrl as string | null) ?? null,
    pdfUrl: (raw.pdfUrl as string | null) ?? null,
    authorNames: sorted.map((a) => a.user?.username ?? "Unknown"),
  };
}

export const publicationsApi = {
  list: async (
    params: PublicationListParams,
  ): Promise<{ data: PublicationSummary[]; nextCursor: string | null }> => {
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit) search.set("limit", String(params.limit));
    const page = await apiFetch<{ data: Record<string, unknown>[]; nextCursor: string | null }>(
      `/publications${search.toString() ? `?${search.toString()}` : ""}`,
    );
    return { data: page.data.map(mapPublication), nextCursor: page.nextCursor };
  },

  getById: async (id: string): Promise<PublicationSummary | null> => {
    try {
      const raw = await apiFetch<Record<string, unknown>>(`/publications/${id}`);
      return mapPublication(raw);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },
};
