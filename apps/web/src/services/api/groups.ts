import { apiFetch } from "./client";

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  memberCount: number;
  conversationId: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
  createdAt: string;
  conversationId: string | null;
  members: {
    userId: string;
    username: string;
    avatarUrl: string | null;
    role: string;
    groupRole: "owner" | "member";
  }[];
}

export interface InviteLink {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitePreview {
  groupName: string;
  description: string | null;
  creatorUsername: string;
  memberCount: number;
  expiresAt: string;
}

/**
 * Groups API — personal communication objects with real membership. All
 * authorization is server-side; the invite preview is public (the link IS
 * the invitation context), joining always requires authentication.
 */
export const groupsApi = {
  create: async (input: {
    name: string;
    description?: string;
    avatarUrl?: string;
  }): Promise<GroupSummary & { conversationId: string }> => {
    return apiFetch("/groups", { method: "POST", body: input });
  },

  get: async (groupId: string): Promise<GroupDetail | null> => {
    try {
      return await apiFetch<GroupDetail>(`/groups/${groupId}`);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },

  listMine: async (): Promise<{ data: GroupSummary[] }> => {
    return apiFetch("/groups/mine");
  },

  update: async (
    groupId: string,
    input: { name?: string; description?: string; avatarUrl?: string | null },
  ): Promise<GroupDetail> => {
    return apiFetch(`/groups/${groupId}`, { method: "PATCH", body: input });
  },

  invite: async (groupId: string, userId: string): Promise<{ invited: boolean; requestId: string }> => {
    return apiFetch(`/groups/${groupId}/invitations`, {
      method: "POST",
      body: { userId },
    });
  },

  respondToInvitation: async (
    requestId: string,
    action: "accept" | "decline",
  ): Promise<Record<string, unknown>> => {
    return apiFetch(`/groups/invitations/${requestId}/${action}`, { method: "PATCH" });
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await apiFetch(`/groups/${groupId}/members/remove`, {
      method: "POST",
      body: { userId },
    });
  },

  leave: async (groupId: string): Promise<void> => {
    await apiFetch(`/groups/${groupId}/leave`, { method: "POST" });
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
  },

  createInviteLink: async (
    groupId: string,
    ttlHours?: number,
  ): Promise<InviteLink> => {
    return apiFetch(`/groups/${groupId}/invite-links`, {
      method: "POST",
      body: ttlHours ? { ttlHours } : {},
    });
  },

  listInviteLinks: async (groupId: string): Promise<{ data: InviteLink[] }> => {
    return apiFetch(`/groups/${groupId}/invite-links`);
  },

  revokeInviteLink: async (groupId: string, linkId: string): Promise<void> => {
    await apiFetch(`/groups/${groupId}/invite-links/${linkId}`, { method: "DELETE" });
  },

  getInvitePreview: async (token: string): Promise<InvitePreview | null> => {
    try {
      return await apiFetch<InvitePreview>(`/groups/join/${token}`);
    } catch (err) {
      if (err && typeof err === "object" && "status" in err) {
        return null; // expired/revoked/invalid — the page shows the state
      }
      throw err;
    }
  },

  acceptInviteLink: async (
    token: string,
  ): Promise<{ joined: boolean; groupId: string; conversationId: string | null }> => {
    return apiFetch(`/groups/join/${token}`, { method: "POST" });
  },
};
