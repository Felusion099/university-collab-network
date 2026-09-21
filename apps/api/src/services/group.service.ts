import { prisma } from "../repositories/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { conversationRepository } from "../repositories/conversation.repository.js";
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from "../utils/errors.js";
import { randomBytes } from "node:crypto";

/**
 * Groups — personal communication objects (independent of projects/research
 * teams). Reuses the ENTIRE messaging architecture: every group gets a
 * linked type:"group" Conversation; messages/history/realtime/unread all
 * flow through the existing conversation endpoints. Membership via the
 * EXISTING JoinRequest table (groupId column — the ONE invitation
 * mechanism, D-024 parity) and secure opaque invite links.
 *
 * Authorization: owner manages (update/members/invites/links); members
 * chat. Server-side — the frontend never decides.
 */

const DEFAULT_LINK_TTL_HOURS = 24;
const ALLOWED_TTL_HOURS = [1, 6, 24, 72, 168];

async function notify(userId: string, type: string, payload: object) {
  try {
    await notificationRepository.create(userId, type, payload);
  } catch {
    // non-blocking
  }
}

async function assertOwner(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("Group not found");
  if (group.ownerId !== userId) throw new ForbiddenError("Only the group owner can do this");
  return group;
}

/** Creates the group + owner membership + linked group conversation. */
export async function createGroup(userId: string, input: { name: string; description?: string; avatarUrl?: string }) {
  if (!input.name?.trim()) throw new BadRequestError("Group name is required");

  const group = await prisma.group.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      avatarUrl: input.avatarUrl || null,
      ownerId: userId,
      members: { create: { userId, role: "owner" } },
    },
  });

  // Linked group conversation — messages/history/realtime/unread reuse the
  // existing conversation architecture (no second chat backend).
  const conversation = await conversationRepository.create({
    type: "group",
    participantIds: [userId],
    groupId: group.id,
  });

  return { ...group, conversationId: conversation.id };
}

/** Member-only group detail (owner sees owner flag). */
export async function getGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } } },
      },
    },
  });
  if (!group) throw new NotFoundError("Group not found");
  const me = group.members.find((m) => m.userId === userId);
  if (!me) throw new ForbiddenError("Only group members can access this group");
  const conversation = await prisma.conversation.findUnique({
    where: { groupId },
    select: { id: true },
  });
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatarUrl,
    isOwner: group.ownerId === userId,
    createdAt: group.createdAt.toISOString(),
    conversationId: conversation?.id ?? null,
    members: group.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      role: m.user.requestedRole,
      groupRole: m.role,
    })),
  };
}

/** The caller's groups — Messages → Groups tab. */
export async function listMyGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          conversation: { select: { id: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return {
    data: memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      avatarUrl: m.group.avatarUrl,
      isOwner: m.group.ownerId === userId,
      memberCount: m.group._count.members,
      conversationId: m.group.conversation?.id ?? null,
    })),
  };
}

/** Owner-only identity edit (persists; Messages reflects it). */
export async function updateGroup(
  userId: string,
  groupId: string,
  input: { name?: string; description?: string; avatarUrl?: string | null },
) {
  await assertOwner(groupId, userId);
  return prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });
}

/** Owner invites a user via the EXISTING JoinRequest mechanism (groupId). */
export async function inviteToGroup(ownerId: string, groupId: string, inviteeId: string) {
  const group = await assertOwner(groupId, ownerId);
  const invitee = await userRepository.findByIdLean(inviteeId);
  if (!invitee) throw new NotFoundError("User not found");
  if (invitee.status === "suspended" || invitee.status === "banned") {
    throw new ForbiddenError("This user cannot be invited");
  }
  const alreadyMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: inviteeId } },
  });
  if (alreadyMember) throw new ConflictError("Already a member of this group");
  const duplicate = await prisma.joinRequest.findFirst({
    where: { groupId, userId: inviteeId, direction: "invitation", status: "pending" },
  });
  if (duplicate) throw new ConflictError("Already invited");

  const request = await prisma.joinRequest.create({
    data: { groupId, userId: inviteeId, direction: "invitation" },
  });

  await notify(inviteeId, "project_invitation", {
    kind: "group_invitation",
    requestId: request.id,
    groupId,
    groupName: group.name,
  });

  return { invited: true, requestId: request.id };
}

/** Invitee accepts → REAL GroupMember row + conversation participant. */
export async function acceptGroupInvitation(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.groupId) throw new NotFoundError("Invitation not found");
  if (request.userId !== userId) throw new ForbiddenError("This invitation is not yours");
  if (request.status !== "pending") throw new ConflictError("Invitation already handled");

  const group = await prisma.group.findUnique({ where: { id: request.groupId } });
  if (!group) throw new NotFoundError("This group is no longer available");

  const conversation = await prisma.conversation.findUnique({
    where: { groupId: request.groupId },
    select: { id: true },
  });

  const alreadyMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: request.groupId, userId } },
  });
  if (!alreadyMember) {
    await prisma.groupMember.create({
      data: { groupId: request.groupId, userId, role: "member" },
    });
  }
  if (conversation && !(await conversationRepository.isParticipant(conversation.id, userId))) {
    await prisma.conversationParticipant.create({
      data: { conversationId: conversation.id, userId },
    });
  }
  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } });

  await notify(group.ownerId, "project_invitation", {
    kind: "group_invitation_accepted",
    groupId: group.id,
    groupName: group.name,
    userId,
  });

  return { accepted: true, groupId: group.id, conversationId: conversation?.id ?? null };
}

export async function declineGroupInvitation(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.groupId) throw new NotFoundError("Invitation not found");
  if (request.userId !== userId) throw new ForbiddenError("This invitation is not yours");
  if (request.status !== "pending") throw new ConflictError("Invitation already handled");
  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });
  return { declined: true };
}

/** Owner removes a member: membership + conversation access revoked. */
export async function removeMember(ownerId: string, groupId: string, memberUserId: string) {
  await assertOwner(groupId, ownerId);
  if (memberUserId === ownerId) throw new ConflictError("The owner cannot be removed");
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: memberUserId } },
  });
  if (!member) throw new NotFoundError("Not a member of this group");

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: memberUserId } } });
  const conversation = await prisma.conversation.findUnique({ where: { groupId }, select: { id: true } });
  if (conversation) {
    await prisma.conversationParticipant
      .delete({ where: { conversationId_userId: { conversationId: conversation.id, userId: memberUserId } } })
      .catch(() => undefined);
  }
  return { removed: true };
}

/** Member leaves: same as removal (no ghost membership). */
export async function leaveGroup(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("Group not found");
  if (group.ownerId === userId) {
    throw new ConflictError("The owner cannot leave — delete the group or transfer ownership");
  }
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new NotFoundError("Not a member of this group");

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  const conversation = await prisma.conversation.findUnique({ where: { groupId }, select: { id: true } });
  if (conversation) {
    await prisma.conversationParticipant
      .delete({ where: { conversationId_userId: { conversationId: conversation.id, userId } } })
      .catch(() => undefined);
  }
  return { left: true };
}

/* ============================ invite links ============================ */

/** Owner creates an expiring link with a secure opaque token. */
export async function createInviteLink(
  ownerId: string,
  groupId: string,
  ttlHours = DEFAULT_LINK_TTL_HOURS,
) {
  await assertOwner(groupId, ownerId);
  if (!ALLOWED_TTL_HOURS.includes(ttlHours)) {
    throw new BadRequestError("Expiry must be one of 1, 6, 24, 72, or 168 hours");
  }
  const token = randomBytes(24).toString("base64url");
  const link = await prisma.groupInviteLink.create({
    data: {
      groupId,
      token,
      createdBy: ownerId,
      expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
    },
  });
  return {
    id: link.id,
    token: link.token,
    expiresAt: link.expiresAt.toISOString(),
  };
}

export async function listInviteLinks(ownerId: string, groupId: string) {
  await assertOwner(groupId, ownerId);
  const links = await prisma.groupInviteLink.findMany({
    where: { groupId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return {
    data: links.map((l) => ({
      id: l.id,
      token: l.token,
      expiresAt: l.expiresAt.toISOString(),
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export async function revokeInviteLink(ownerId: string, groupId: string, linkId: string) {
  await assertOwner(groupId, ownerId);
  const link = await prisma.groupInviteLink.findUnique({ where: { id: linkId } });
  if (!link || link.groupId !== groupId) throw new NotFoundError("Invite link not found");
  if (link.revokedAt) throw new ConflictError("Link already revoked");
  await prisma.groupInviteLink.update({ where: { id: linkId }, data: { revokedAt: new Date() } });
  return { revoked: true };
}

/** Public invite preview — validates token/expiry/revocation; the group
 * id is never enough to join. Returns ONLY safe display fields. */
export async function getInvitePreview(token: string) {
  const link = await prisma.groupInviteLink.findUnique({
    where: { token },
    include: {
      group: {
        include: { _count: { select: { members: true } } },
      },
      creator: { select: { username: true } },
    },
  });
  if (!link) throw new NotFoundError("This invitation link is not valid");
  if (link.revokedAt) throw new ForbiddenError("This invitation link is no longer active");
  if (link.expiresAt < new Date()) throw new ForbiddenError("This invitation link has expired");

  return {
    groupName: link.group.name,
    description: link.group.description,
    creatorUsername: link.creator.username,
    memberCount: link.group._count.members,
    expiresAt: link.expiresAt.toISOString(),
  };
}

/** Accept an invite link: server validates token/expiry/revocation/group/
 * account status/duplicate membership → REAL membership + participant. */
export async function acceptInviteLink(userId: string, token: string) {
  const link = await prisma.groupInviteLink.findUnique({
    where: { token },
    include: { group: { select: { id: true, name: true, ownerId: true } } },
  });
  if (!link) throw new NotFoundError("This invitation link is not valid");
  if (link.revokedAt) throw new ForbiddenError("This invitation link is no longer active");
  if (link.expiresAt < new Date()) throw new ForbiddenError("This invitation link has expired");
  if (!link.group) throw new NotFoundError("This group is no longer available");

  const user = await userRepository.findByIdLean(userId);
  if (!user || user.status === "suspended" || user.status === "banned") {
    throw new ForbiddenError("This account cannot join groups");
  }

  const alreadyMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: link.group.id, userId } },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { groupId: link.group.id },
    select: { id: true },
  });

  if (!alreadyMember) {
    await prisma.groupMember.create({
      data: { groupId: link.group.id, userId, role: "member" },
    });
  }
  if (conversation && !(await conversationRepository.isParticipant(conversation.id, userId))) {
    await prisma.conversationParticipant.create({
      data: { conversationId: conversation.id, userId },
    });
  }

  await notify(link.group.ownerId, "project_invitation", {
    kind: "group_member_joined",
    groupId: link.group.id,
    groupName: link.group.name,
    userId,
  });

  return { joined: true, groupId: link.group.id, conversationId: conversation?.id ?? null, alreadyMember: Boolean(alreadyMember) };
}

/** Owner deletes the group entirely (danger zone). */
export async function deleteGroup(ownerId: string, groupId: string) {
  await assertOwner(groupId, ownerId);
  const conversation = await prisma.conversation.findUnique({ where: { groupId }, select: { id: true } });
  await prisma.group.delete({ where: { id: groupId } });
  if (conversation) {
    await prisma.conversation.delete({ where: { id: conversation.id } }).catch(() => undefined);
  }
  return { deleted: true };
}
