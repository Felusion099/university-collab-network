import { prisma } from "../repositories/prisma.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import { conversationRepository } from "../repositories/conversation.repository.js";
import type { SpaceType, MembershipMode } from "@prisma/client";

const SPACE_TYPES: SpaceType[] = [
  "project",
  "community",
  "club",
  "research",
  "study_group",
  "startup",
  "other",
];
const MEMBERSHIP_MODES: MembershipMode[] = ["open", "request_to_join", "invite_only"];

type SpaceMembership = { role: "owner" | "admin" | "member" } | null;

async function getMembership(spaceId: string, userId: string): Promise<SpaceMembership> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: spaceId, userId } },
    select: { role: true },
  });
  return membership ? { role: membership.role } : null;
}

/** Active access = member/admin/owner. Project-linked spaces are synced to
 * ProjectMember by project.service (the source of truth for those), so this
 * single check governs chat access for BOTH space kinds. */
async function assertMember(spaceId: string, userId: string): Promise<"owner" | "admin" | "member"> {
  const membership = await getMembership(spaceId, userId);
  if (!membership) throw new ForbiddenError("Only space members can access this space");
  return membership.role;
}

async function assertAdminOrOwner(spaceId: string, userId: string): Promise<"owner" | "admin"> {
  const membership = await getMembership(spaceId, userId);
  if (!membership || membership.role === "member")
    throw new ForbiddenError("Only the space owner or an admin can do this");
  return membership.role;
}

async function assertOwner(spaceId: string, userId: string): Promise<void> {
  const membership = await getMembership(spaceId, userId);
  if (!membership || membership.role !== "owner")
    throw new ForbiddenError("Only the space owner can do this");
}

/** Creates the space's chat conversation (reuses the EXISTING conversation
 * architecture — messages/history/realtime/unread, no second chat backend). */
export async function ensureSpaceConversation(spaceId: string, ownerId: string) {
  const existing = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
  if (existing) return existing;
  return conversationRepository.create({
    type: "group",
    participantIds: [ownerId],
    groupId: spaceId,
  });
}

/** Creates a Collaboration Space. Optional linkedProjectId makes it a
 * PROJECT space (one per project, creator-of-project only). The creator
 * becomes Space Owner + active member, inside one transaction. */
export async function createSpace(
  userId: string,
  input: {
    name: string;
    description?: string;
    type?: string;
    visibility?: string;
    membershipMode?: string;
    linkedProjectId?: string;
  },
) {
  if (!input.name?.trim()) throw new BadRequestError("Space name is required");

  const type = (input.type ?? "community") as SpaceType;
  if (!SPACE_TYPES.includes(type)) throw new BadRequestError("Invalid space type");
  const visibility = (input.visibility ?? "private") as "public" | "university_only" | "connections_only" | "private";
  const membershipMode = (input.membershipMode ?? "request_to_join") as MembershipMode;
  if (!MEMBERSHIP_MODES.includes(membershipMode))
    throw new BadRequestError("Invalid membership mode");

  if (input.linkedProjectId) {
    const project = await prisma.project.findUnique({ where: { id: input.linkedProjectId } });
    if (!project) throw new NotFoundError("Project not found");
    if (project.createdBy !== userId)
      throw new ForbiddenError("Only the project creator can create its Collaboration Space");
  }

  const space = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        type,
        visibility,
        membershipMode,
        linkedProjectId: input.linkedProjectId ?? null,
        ownerId: userId,
        members: { create: { userId, role: "owner" } },
      },
    });
    return created;
  });

  const conversation = await ensureSpaceConversation(space.id, userId);
  return { ...space, conversationId: conversation.id };
}

/** Resolves the project's linked Collaboration Space (Project ↔ Space both
 * directions). Project spaces are invite_only — the project membership is the
 * source of truth, so non-members get the preview only per visibility rules. */
export async function findSpaceByProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new NotFoundError("Project not found");
  const space = await prisma.group.findUnique({
    where: { linkedProjectId: projectId },
    include: { linkedProject: { select: { id: true, name: true } } },
  });
  if (!space) throw new NotFoundError("This project has no Collaboration Space yet");
  const me = await getMembership(space.id, userId);
  if (!me && space.visibility !== "public" && space.visibility !== "university_only") {
    throw new ForbiddenError("This project's space is private — become a project member first");
  }
  const conversation = await prisma.conversation.findUnique({
    where: { groupId: space.id },
    select: { id: true },
  });
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    type: space.type,
    visibility: space.visibility,
    membershipMode: space.membershipMode,
    linkedProject: space.linkedProject,
    isOwner: space.ownerId === userId,
    myRole: me?.role ?? null,
    isMember: !!me,
    conversationId: conversation?.id ?? null,
  };
}

/** Visibility-aware space detail. Members get full data (incl. chat);
 * non-members get a preview ONLY for public/university_only spaces —
 * a private space is never accessible by knowing its ID. */
export async function getSpace(spaceId: string, userId: string) {
  const space = await prisma.group.findUnique({
    where: { id: spaceId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } } },
      },
      linkedProject: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!space) throw new NotFoundError("Space not found");
  const me = await getMembership(spaceId, userId);

  if (!me && space.visibility !== "public" && space.visibility !== "university_only") {
    throw new ForbiddenError("This space is private");
  }

  // The chat conversation id is ONLY exposed to members — non-members never
  // get a handle into the space's chat (the participant check protects the
  // messages themselves, but the handle shouldn't leave the space either).
  const conversation = me
    ? await prisma.conversation.findUnique({
        where: { groupId: spaceId },
        select: { id: true },
      })
    : null;

  return {
    id: space.id,
    name: space.name,
    description: space.description,
    type: space.type,
    visibility: space.visibility,
    membershipMode: space.membershipMode,
    linkedProject: space.linkedProject,
    isOwner: space.ownerId === userId,
    myRole: me?.role ?? null,
    isMember: !!me,
    createdAt: space.createdAt.toISOString(),
    conversationId: conversation?.id ?? null,
    memberCount: space._count.members,
    members: me
      ? space.members.map((m) => ({
          userId: m.userId,
          username: m.user.username,
          avatarUrl: m.user.avatarUrl,
          role: m.user.requestedRole,
          spaceRole: m.role,
        }))
      : [],
  };
}

/** Discovery: public/university_only spaces (private/connections_only are
 * never listed). Free-text q + optional type filter. */
export async function listSpaces(
  userId: string,
  params: { type?: string; q?: string; cursor?: string; limit?: number },
) {
  const { skip, take } = toPageParams(params.cursor, params.limit ?? 20);
  const spaces = await prisma.group.findMany({
    where: {
      visibility: { in: ["public", "university_only"] },
      ...(params.type && SPACE_TYPES.includes(params.type as SpaceType)
        ? { type: params.type as SpaceType }
        : {}),
      ...(params.q?.trim()
        ? {
            OR: [
              { name: { contains: params.q.trim(), mode: "insensitive" } },
              { description: { contains: params.q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { members: true } },
      linkedProject: { select: { id: true, name: true } },
      members: { where: { userId }, select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
  return buildPaginatedResponse(
    spaces.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: s.type,
      visibility: s.visibility,
      membershipMode: s.membershipMode,
      linkedProject: s.linkedProject,
      memberCount: s._count.members,
      isMember: s.members.length > 0,
    })),
    skip,
    take,
  );
}

/** The caller's spaces (all kinds). */
export async function listMySpaces(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          conversation: { select: { id: true } },
          _count: { select: { members: true } },
          linkedProject: { select: { id: true, name: true } },
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
      type: m.group.type,
      visibility: m.group.visibility,
      membershipMode: m.group.membershipMode,
      linkedProject: m.group.linkedProject,
      isOwner: m.group.ownerId === userId,
      memberCount: m.group._count.members,
      conversationId: m.group.conversation?.id ?? null,
    })),
  };
}

/** Owner/admin identity+settings edit. */
export async function updateSpace(
  userId: string,
  spaceId: string,
  input: {
    name?: string;
    description?: string;
    visibility?: string;
    membershipMode?: string;
  },
) {
  await assertAdminOrOwner(spaceId, userId);
  return prisma.group.update({
    where: { id: spaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.visibility !== undefined
        ? {
            visibility: input.visibility as
              | "public"
              | "university_only"
              | "connections_only"
              | "private",
          }
        : {}),
      ...(input.membershipMode !== undefined
        ? { membershipMode: input.membershipMode as MembershipMode }
        : {}),
    },
  });
}

/** Join flow per membership mode:
 * OPEN → member immediately. REQUEST_TO_JOIN → pending JoinRequest for
 * owner/admin approval. INVITE_ONLY → forbidden (invitations/links only). */
export async function joinSpace(userId: string, spaceId: string) {
  const space = await prisma.group.findUnique({ where: { id: spaceId } });
  if (!space) throw new NotFoundError("Space not found");

  const me = await getMembership(spaceId, userId);
  if (me) throw new ConflictError("Already a member of this space");

  if (space.membershipMode === "invite_only")
    throw new ForbiddenError("This space is invite-only — you need an invitation");

  if (space.membershipMode === "open") {
    // Transactional: membership + chat participant together
    const conversation = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.create({ data: { groupId: spaceId, userId, role: "member" } });
      if (conversation) {
        await tx.conversationParticipant
          .create({ data: { conversationId: conversation.id, userId } })
          .catch(() => undefined);
      }
    });
    return { joined: true, pending: false };
  }

  // REQUEST_TO_JOIN
  const existing = await prisma.joinRequest.findFirst({
    where: { groupId: spaceId, userId, direction: "request", status: "pending" },
  });
  if (existing) throw new ConflictError("You already have a pending request for this space");
  await prisma.joinRequest.create({
    data: { groupId: spaceId, userId, direction: "request", status: "pending" },
  });
  try {
    await notificationRepository.create(space.ownerId, "team_recruitment", {
      spaceId,
      spaceName: space.name,
      requesterId: userId,
      kind: "space_join_request",
    });
  } catch {
    // Non-blocking notification side effect
  }
  return { joined: false, pending: true };
}

/** Owner/admin: pending join requests for the space. */
export async function listJoinRequests(userId: string, spaceId: string) {
  await assertAdminOrOwner(spaceId, userId);
  const requests = await prisma.joinRequest.findMany({
    where: { groupId: spaceId, direction: "request", status: "pending" },
    include: { user: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return {
    data: requests.map((r) => ({
      id: r.id,
      user: r.user,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/** Approve → membership created + chat access granted (transactional). */
export async function approveJoinRequest(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.groupId) throw new NotFoundError("Join request not found");
  await assertAdminOrOwner(request.groupId, userId);
  if (request.status !== "pending") throw new ConflictError("This request was already handled");

  const conversation = await prisma.conversation.findUnique({
    where: { groupId: request.groupId },
  });
  await prisma.$transaction(async (tx) => {
    await tx.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } });
    await tx.groupMember.create({
      data: { groupId: request.groupId!, userId: request.userId, role: "member" },
    });
    if (conversation) {
      await tx.conversationParticipant
        .create({ data: { conversationId: conversation.id, userId: request.userId } })
        .catch(() => undefined);
    }
  });
  try {
    const space = await prisma.group.findUnique({ where: { id: request.groupId } });
    await notificationRepository.create(request.userId, "team_recruitment", {
      spaceId: request.groupId,
      spaceName: space?.name,
      kind: "space_join_approved",
    });
  } catch {
    // Non-blocking notification side effect
  }
  return { approved: true };
}

export async function rejectJoinRequest(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.groupId) throw new NotFoundError("Join request not found");
  await assertAdminOrOwner(request.groupId, userId);
  if (request.status !== "pending") throw new ConflictError("This request was already handled");
  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });
  return { rejected: true };
}

/** Owner-only: promote a member to admin. */
export async function addSpaceAdmin(userId: string, spaceId: string, memberUserId: string) {
  await assertOwner(spaceId, userId);
  const membership = await getMembership(spaceId, memberUserId);
  if (!membership) throw new NotFoundError("That user is not a member of this space");
  if (membership.role !== "member") throw new ConflictError("Only members can be promoted");
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId: spaceId, userId: memberUserId } },
    data: { role: "admin" },
  });
  return { promoted: true };
}

/** Owner-only: demote an admin back to member. The owner cannot be demoted. */
export async function removeSpaceAdmin(userId: string, spaceId: string, memberUserId: string) {
  await assertOwner(spaceId, userId);
  if (memberUserId === userId) throw new ConflictError("The owner cannot be demoted");
  const membership = await getMembership(spaceId, memberUserId);
  if (!membership || membership.role !== "admin")
    throw new NotFoundError("That user is not an admin of this space");
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId: spaceId, userId: memberUserId } },
    data: { role: "member" },
  });
  return { demoted: true };
}

/** Member leaves an INDEPENDENT space (project-linked spaces use the project
 * leave/removal flows — Project membership is the source of truth there).
 * Historical messages are preserved — only active participation is lost. */
export async function leaveSpace(userId: string, spaceId: string) {
  const space = await prisma.group.findUnique({ where: { id: spaceId } });
  if (!space) throw new NotFoundError("Space not found");
  if (space.ownerId === userId)
    throw new ForbiddenError("The space owner cannot leave — delete the space instead");
  const membership = await getMembership(spaceId, userId);
  if (!membership) throw new NotFoundError("Membership not found");
  await prisma.$transaction(async (tx) => {
    await tx.groupMember.delete({
      where: { groupId_userId: { groupId: spaceId, userId } },
    });
    await tx.conversationParticipant
      .deleteMany({ where: { conversationId: spaceId ? undefined : undefined } })
      .catch(() => undefined);
  });
  // Remove chat participation without touching messages (history preserved)
  const conversation = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
  if (conversation) {
    await prisma.conversationParticipant
      .delete({
        where: { conversationId_userId: { conversationId: conversation.id, userId } },
      })
      .catch(() => undefined);
  }
  return { left: true };
}

/** Admin/owner removes a member (independent spaces only — project-linked
 * members are removed via the project flows). Messages preserved. */
export async function removeMember(userId: string, spaceId: string, memberUserId: string) {
  const space = await prisma.group.findUnique({ where: { id: spaceId } });
  if (!space) throw new NotFoundError("Space not found");
  if (space.linkedProjectId)
    throw new ForbiddenError(
      "Project-linked space members are managed through the project's member management",
    );
  await assertAdminOrOwner(spaceId, userId);
  if (memberUserId === space.ownerId)
    throw new ConflictError("The owner cannot be removed");
  const membership = await getMembership(spaceId, memberUserId);
  if (!membership) throw new NotFoundError("That user is not a member of this space");
  if (membership.role === "admin" && space.ownerId !== userId)
    throw new ForbiddenError("Only the owner can remove an admin");
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: spaceId, userId: memberUserId } },
  });
  const conversation = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
  if (conversation) {
    await prisma.conversationParticipant
      .delete({
        where: { conversationId_userId: { conversationId: conversation.id, userId: memberUserId } },
      })
      .catch(() => undefined);
  }
  return { removed: true };
}

/** Pin/unpin — space admin/owner only, for the space's chat (direct chats
 * have no space and can't pin). The message must belong to the space. */
export async function setMessagePinned(
  userId: string,
  spaceId: string,
  messageId: string,
  pinned: boolean,
) {
  await assertAdminOrOwner(spaceId, userId);
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new NotFoundError("Message not found");
  const conversation = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
  if (!conversation || message.conversationId !== conversation.id)
    throw new BadRequestError("That message does not belong to this space");
  return prisma.message.update({
    where: { id: messageId },
    data: { pinnedAt: pinned ? new Date() : null },
  });
}

/** Pinned messages for a space's chat (members only). */
export async function listPinnedMessages(userId: string, spaceId: string) {
  await assertMember(spaceId, userId);
  const conversation = await prisma.conversation.findUnique({ where: { groupId: spaceId } });
  if (!conversation) return { data: [] };
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id, pinnedAt: { not: null } },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { pinnedAt: "desc" },
    take: 50,
  });
  return {
    data: messages.map((m) => ({
      id: m.id,
      body: m.body,
      sender: m.sender,
      sentAt: m.sentAt.toISOString(),
      pinnedAt: m.pinnedAt!.toISOString(),
    })),
  };
}

/** Owner deletes the space FOR REAL (chat + memberships cascade). */
export async function deleteSpace(userId: string, spaceId: string) {
  await assertOwner(spaceId, userId);
  await prisma.group.delete({ where: { id: spaceId } });
}

// ─── PROJECT ↔ SPACE SYNCHRONIZATION ────────────────────────────────────────
// Project membership is the source of truth for PROJECT-linked spaces.
// project.service calls these inside its own transactions so membership and
// access move together (never partially applied).

/** Run INSIDE a project.service transaction after a project member is added:
 * grants the space membership + chat participant. Idempotent (upsert). */
export async function syncProjectMemberAddedTx(
  tx: { groupMember: any; conversationParticipant: any; group: any; conversation: any },
  projectId: string,
  userId: string,
) {
  const space = await txSpaceForProjectTx(tx, projectId);
  if (!space) return;
  await tx.groupMember.upsert({
    where: { groupId_userId: { groupId: space.id, userId } },
    create: { groupId: space.id, userId, role: "member" },
    update: {},
  });
  await tx.conversationParticipant
    .create({ data: { conversationId: space.conversationId, userId } })
    .catch(() => undefined);
}

/** Run INSIDE a project.service transaction after a project member is
 * removed/leaves: revokes ACTIVE space access. Historical messages are
 * preserved — only participation is lost. */
export async function syncProjectMemberRemovedTx(
  tx: { groupMember: any; conversationParticipant: any; group: any; conversation: any },
  projectId: string,
  userId: string,
) {
  const space = await txSpaceForProjectTx(tx, projectId);
  if (!space) return;
  await tx.groupMember.deleteMany({ where: { groupId: space.id, userId } });
  await tx.conversationParticipant.deleteMany({
    where: { conversationId: space.conversationId, userId },
  });
}

async function txSpaceForProjectTx(tx: { group: any; conversation: any }, projectId: string) {
  const space = await tx.group.findUnique({
    where: { linkedProjectId: projectId },
    include: { conversation: { select: { id: true } } },
  });
  if (!space) return null;
  return { id: space.id, conversationId: space.conversation?.id ?? null };
}
