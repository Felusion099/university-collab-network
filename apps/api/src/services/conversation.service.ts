import { conversationRepository } from "../repositories/conversation.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateConversationRequest, CreateMessageRequest } from "@app/shared-types";
import { messageBus } from "./messageBus.js";

export async function create(userId: string, input: CreateConversationRequest) {
  const participantIds = Array.from(new Set([userId, ...input.participantIds]));

  if (input.type === "direct") {
    if (participantIds.length !== 2) {
      throw new BadRequestError("A direct conversation must have exactly two participants");
    }
    const existing = await conversationRepository.findExistingDirect(participantIds);
    if (existing) return existing;
  }

  return conversationRepository.create({
    type: input.type,
    participantIds,
    projectId: input.projectId,
    researchTeamId: input.researchTeamId,
    organizationId: input.organizationId,
  });
}

export async function list(userId: string, cursor: string | undefined, limit: number) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await conversationRepository.listForUser(userId, { skip, take });
  return buildPaginatedResponse(items, skip, take);
}

async function assertParticipant(conversationId: string, userId: string) {
  const isParticipant = await conversationRepository.isParticipant(conversationId, userId);
  if (!isParticipant) throw new ForbiddenError("You are not a participant in this conversation");
}

export async function assertParticipantForStream(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
}

export async function getById(userId: string, id: string) {
  await assertParticipant(id, userId);
  const conversation = await conversationRepository.findById(id);
  if (!conversation) throw new NotFoundError("Conversation not found");
  return conversation;
}

export async function listMessages(
  userId: string,
  conversationId: string,
  cursor: string | undefined,
  limit: number,
) {
  await assertParticipant(conversationId, userId);
  const { skip, take } = toPageParams(cursor, limit);
  const items = await conversationRepository.listMessages(conversationId, { skip, take });
  return buildPaginatedResponse(items, skip, take);
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  input: CreateMessageRequest,
) {
  await assertParticipant(conversationId, userId);
  const msg = await conversationRepository.createMessage({
    conversationId,
    senderId: userId,
    body: input.body,
    attachmentUrl: input.attachmentUrl,
    invitationType: input.invitationType,
    invitationRefId: input.invitationRefId,
  });

  // Realtime delivery — SSE subscribers get the message immediately
  messageBus.publish(conversationId, msg);

  try {
    const conv = await conversationRepository.findById(conversationId);
    if (conv && conv.participants) {
      for (const p of conv.participants) {
        if (p.userId !== userId) {
          let notifType = "new_message";
          if (input.invitationType === "project") notifType = "project_invitation";
          else if (input.invitationType === "research_team") notifType = "research_invitation";

          await notificationRepository.create(p.userId, notifType, {
            conversationId,
            messageId: msg.id,
            senderId: userId,
            invitationType: input.invitationType,
            invitationRefId: input.invitationRefId,
          });
        }
      }
    }
  } catch {
    // Non-blocking notification side effect
  }

  return msg;
}
