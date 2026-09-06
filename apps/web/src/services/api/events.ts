import type { EventType } from "@app/shared-types";

/**
 * PROVISIONAL mock for GET /events and GET /events/:id — already
 * documented in API_CONTRACT.md §3's generic resource convention, so no
 * new HANDOFF entry needed for the endpoint itself. Same known gap as
 * projects.ts/directory.ts: no read-response Zod schema exists yet in
 * `packages/shared-types`. Field names mirror `CreateEventRequestSchema`
 * (packages/shared-types/src/resources.ts) exactly; `EventTypeEnum` is
 * imported directly rather than re-declared so this can't drift from the
 * real enum.
 */
export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  date: string; // ISO date, matches CreateEventRequestSchema's z.string().date()
  time: string | null;
  venue: string | null;
  organizerName: string | null;
  registrationUrl: string | null;
}

export interface EventListParams {
  eventType?: EventType;
  q?: string;
  cursor?: string | null;
  limit?: number;
}

const MOCK_EVENTS: EventSummary[] = [
  {
    id: "e-1",
    title: "Winter Hackathon 2026",
    description: "48-hour build event, open to all departments. Prizes for top 3 teams.",
    eventType: "hackathon",
    date: "2026-11-14",
    time: "09:00",
    venue: "Innovation Hall, Block C",
    organizerName: "Computer Science Society",
    registrationUrl: "https://example.com/register/hackathon",
  },
  {
    id: "e-2",
    title: "Intro to Research Methods",
    description: "Workshop for first-year students considering an undergrad research track.",
    eventType: "workshop",
    date: "2026-09-20",
    time: "15:00",
    venue: "Library Seminar Room 2",
    organizerName: "Office of Undergraduate Research",
    registrationUrl: null,
  },
  {
    id: "e-3",
    title: "Guest Talk: Distributed Systems at Scale",
    description: null,
    eventType: "guest_lecture",
    date: "2026-09-28",
    time: "17:30",
    venue: "Auditorium A",
    organizerName: "Computer Science Department",
    registrationUrl: "https://example.com/register/guest-talk",
  },
  {
    id: "e-4",
    title: "Robotics Club Demo Day",
    description: "See this semester's robot builds compete in the obstacle course.",
    eventType: "club_event",
    date: "2026-10-05",
    time: "13:00",
    venue: "Engineering Courtyard",
    organizerName: "Robotics Club",
    registrationUrl: null,
  },
];

export const eventsApi = {
  list: async (
    params: EventListParams,
  ): Promise<{ data: EventSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = [...MOCK_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    if (params.eventType) results = results.filter((e) => e.eventType === params.eventType);
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((e) => e.title.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<EventSummary | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_EVENTS.find((e) => e.id === id) ?? null;
  },
};
