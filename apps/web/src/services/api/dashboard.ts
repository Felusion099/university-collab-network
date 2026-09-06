import { UserPlus, FolderPlus, Users2 } from "lucide-react";
import type { TimelineEntry } from "@/components/Timeline";
import { directoryApi, type DirectoryUserSummary } from "@/services/api/directory";

/**
 * PROVISIONAL mock backing /dashboard. No real endpoint documented for
 * this yet (not even in API_CONTRACT.md's generic convention — dashboard
 * aggregation endpoints are typically bespoke, so this isn't a HANDOFF-
 * worthy gap the way a missing CRUD list endpoint would be, just an
 * acknowledged TODO for whoever picks up real dashboard data).
 * `getRecentActivity` deliberately only returns collaboration-formed
 * style events (PROJECT_SPEC.md §42/§56 — never vanity metrics).
 */
export const dashboardApi = {
  getFeaturedProfile: async (): Promise<DirectoryUserSummary | null> => {
    const result = await directoryApi.list({ role: "researcher", limit: 1 });
    return result.data[0] ?? null;
  },

  getRecentActivity: async (): Promise<TimelineEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [
      {
        id: "a-1",
        icon: UserPlus,
        title: "You connected with Priya Sharma",
        date: "2026-09-03",
      },
      {
        id: "a-2",
        icon: FolderPlus,
        title: 'You joined the project "Peer Code Review Bot"',
        date: "2026-08-29",
      },
      {
        id: "a-3",
        icon: Users2,
        title: "You joined the Robotics Club",
        date: "2026-08-20",
      },
    ];
  },
};
