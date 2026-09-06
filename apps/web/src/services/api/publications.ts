/**
 * PROVISIONAL mock for GET /publications and GET /publications/:id —
 * already documented in API_CONTRACT.md §3's generic convention, no new
 * HANDOFF needed. Same read-schema gap as projects/events/opportunities.
 * Field names mirror `CreatePublicationRequestSchema`
 * (packages/shared-types/src/resources.ts) exactly, except `authorIds`
 * (uuid[]) is replaced with `authorNames` (string[]) here — the mock has
 * no user records to resolve FKs against, and a display card only needs
 * names, in `publication_authors.author_order` order per
 * DATABASE_SCHEMA.md.
 */
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

const MOCK_PUBLICATIONS: PublicationSummary[] = [
  {
    id: "pub-1",
    title: "Low-Resource Neural Machine Translation via Synthetic Back-Translation",
    abstract:
      "We evaluate synthetic back-translation strategies for translation pairs with under 10,000 parallel sentences, showing consistent BLEU gains across four language pairs.",
    journalOrConference: "ACL Student Research Workshop",
    publishedDate: "2026-07-12",
    doi: "10.1234/acl.2026.srw.42",
    externalUrl: "https://example.com/paper/nmt-backtranslation",
    pdfUrl: null,
    authorNames: ["Priya Sharma", "Dr. Radhika Iyer"],
  },
  {
    id: "pub-2",
    title: "Nanostructured Coatings for Corrosion Resistance in Marine Environments",
    abstract: null,
    journalOrConference: "Journal of Materials Science (in press)",
    publishedDate: "2026-05-03",
    doi: null,
    externalUrl: null,
    pdfUrl: "https://example.com/paper/nanocoatings.pdf",
    authorNames: ["Kiran Nair", "Dr. Vikram Rao"],
  },
  {
    id: "pub-3",
    title: "A Survey of Debounced Search UX Patterns in Campus Directory Apps",
    abstract: "An informal survey of search interaction patterns across 12 university portals.",
    journalOrConference: null,
    publishedDate: null,
    doi: null,
    externalUrl: null,
    pdfUrl: null,
    authorNames: ["Sanjana Desai"],
  },
];

export const publicationsApi = {
  list: async (
    params: PublicationListParams,
  ): Promise<{ data: PublicationSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_PUBLICATIONS;
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((p) => p.title.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<PublicationSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_PUBLICATIONS.find((p) => p.id === id) ?? null;
  },
};
