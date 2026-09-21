import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class ConversationRepository {
  async findExistingDirect(participantIds: string[]) {
    if (participantIds.length !== 2) return null;
    const candidates = await prisma.conversation.findMany({
      where: {
        type: "direct",
        participants: { some: { userId: participantIds[0] } },
      },
      include: { participants: true },
    });
    return (
      candidates.find((c) => {
        const ids = c.participants.map((p) => p.userId).sort();
        return ids.length === 2 && ids.join(",") === [...participantIds].sort().join(",");
      }) ?? null
    );
  }

  async create(data: {
    type: string;
    participantIds: string[];
    projectId?: string;
    researchTeamId?: string;
    organizationId?: string;
    groupId?: string;
  }) {
    return prisma.conversation.create({
      data: {
        type: data.type as Prisma.ConversationCreateInput["type"],
        project: data.projectId ? { connect: { id: data.projectId } } : undefined,
        researchTeam: data.researchTeamId ? { connect: { id: data.researchTeamId } } : undefined,
        organization: data.organizationId ? { connect: { id: data.organizationId } } : undefined,
        group: data.groupId ? { connect: { id: data.groupId } } : undefined,
        participants: { create: data.participantIds.map((userId) => ({ userId })) },
      },
      include: { participants: { include: { user: { select: SAFE_USER_SELECT } } } },
    });
  }

  async listForUser(userId: string, params: { skip: number; take: number }) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      skip: params.skip,
      take: params.take + 1,
      orderBy: { updatedAt: "desc" },
      include: {
        participants: { include: { user: { select: SAFE_USER_SELECT } } },
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
      },
    });
  }

  /**
   * Unread computation — the caller's own lastReadAt is included so the
   * frontend can derive "unread" (last message sentAt > my lastReadAt)
   * from real database state. No separate fake unread flag.
   */
  async listForUserWithUnread(userId: string, params: { skip: number; take: number }) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      skip: params.skip,
      take: params.take + 1,
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          where: { userId },
          select: { lastReadAt: true },
        },
        messages: { orderBy: { sentAt: "desc" }, take: 1 },
      },
    });
  }

  async isParticipant(conversationId: string, userId: string) {
    const row = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return Boolean(row);
  }

  async findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: { participants: { include: { user: { select: SAFE_USER_SELECT } } } },
    });
  }

  async listMessages(conversationId: string, params: { skip: number; take: number }) {
    return prisma.message.findMany({
      where: { conversationId },
      skip: params.skip,
      take: params.take + 1,
      orderBy: { sentAt: "desc" },
      include: { sender: { select: SAFE_USER_SELECT } },
    });
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    body: string;
    attachmentUrl?: string;
    invitationType?: string;
    invitationRefId?: string;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        body: data.body,
        attachmentUrl: data.attachmentUrl,
        invitationType: data.invitationType as Prisma.MessageCreateInput["invitationType"],
        invitationRefId: data.invitationRefId,
      },
      include: { sender: { select: SAFE_USER_SELECT } },
    });
    // Touch the conversation so "recent conversations" ordering reflects new activity.
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });
    return message;
  }
}

export const conversationRepository = new ConversationRepository();
