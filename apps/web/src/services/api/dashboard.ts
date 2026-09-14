import { UserPlus, FolderPlus, Users2, MessageSquare, ShieldCheck, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TimelineEntry } from "@/components/Timeline";
import { apiFetch } from "./client";
import { directoryApi, type DirectoryUserSummary } from "@/services/api/directory";

/**
 * Real dashboard data — Recent Activity is the caller's actual
 * notifications (the existing Notification table IS the activity record:
 * type + payload + timestamp; no separate Activity model). Each entry is
 * titled from the real payload so the dashboard answers "what happened
 * that involves me?" — never fake or hardcoded events.
 */
export const dashboardApi = {
  getFeaturedProfile: async (): Promise<DirectoryUserSummary | null> => {
    const result = await directoryApi.list({ role: "researcher", limit: 1 });
    return result.data[0] ?? null;
  },

  getRecentActivity: async (): Promise<TimelineEntry[]> => {
    const raw = await apiFetch<{
      data?: { id: string; type: string; payload: Record<string, unknown>; createdAt: string }[];
    }>("/notifications?limit=8");
    return (raw.data ?? []).map((n) => ({
      id: n.id,
      icon: ACTIVITY_ICONS[n.type] ?? Bell,
      title: ACTIVITY_TITLES[n.type]?.(n.payload) ?? "Platform update",
      date: n.createdAt.slice(0, 10),
    }));
  },
};

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  connection_request: UserPlus,
  new_message: MessageSquare,
  project_invitation: FolderPlus,
  research_invitation: Users2,
  team_recruitment: Users2,
  profile_interaction: ShieldCheck,
  new_publication: FolderPlus,
};

type Payload = Record<string, unknown>;
const str = (p: Payload, k: string): string => (typeof p[k] === "string" ? (p[k] as string) : "");

const ACTIVITY_TITLES: Record<string, (p: Payload) => string> = {
  connection_request: (p) =>
    str(p, "requesterName")
      ? `Connection request from ${str(p, "requesterName")}`
      : "New connection request",
  new_message: (p) => (str(p, "senderName") ? `New message from ${str(p, "senderName")}` : "New message received"),
  project_invitation: (p) =>
    str(p, "projectName")
      ? `You were invited to join ${str(p, "projectName")}`
      : "New project invitation",
  research_invitation: (p) =>
    str(p, "teamName") ? `You were invited to join ${str(p, "teamName")}` : "New research invitation",
  team_recruitment: (p) => {
    const kind = str(p, "kind");
    const name = str(p, "projectName") || str(p, "teamName");
    if (kind === "project_join_request" || kind === "team_join_request") {
      const who = str(p, "requesterName") || "Someone";
      return name ? `${who} requested to join ${name}` : `${who} requested to join your project`;
    }
    if (kind === "project_request_accepted" || kind === "team_request_accepted") {
      return name ? `Your request to join ${name} was accepted` : "Your join request was accepted";
    }
    if (kind === "project_invitation_accepted" || kind === "team_invitation_accepted") {
      return name ? `A new member joined ${name}` : "A new member joined your project";
    }
    return "Team recruitment update";
  },
  profile_interaction: (p) => {
    const kind = str(p, "kind");
    if (kind === "verification_approved") return "Your verification request was approved";
    if (kind === "project_request_rejected") return "Your join request was not accepted";
    if (kind === "team_request_rejected") return "Your join request was not accepted";
    return "Profile update";
  },
  new_publication: (p) => `New publication: ${str(p, "title") || "added"}`,
  club_announcement: (p) => str(p, "title") || "Club announcement",
  event_reminder: (p) => str(p, "title") || "Event reminder",
  opportunity_deadline: (p) => str(p, "title") || "Opportunity deadline approaching",
};
