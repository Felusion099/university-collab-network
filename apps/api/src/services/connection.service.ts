import { connectionRepository } from "../repositories/connection.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { ConnectionStatus } from "@app/shared-types";

export async function create(requesterId: string, addresseeId: string, message: string) {
  if (requesterId === addresseeId) throw new BadRequestError("You cannot connect with yourself");
  const existing = await connectionRepository.findBetween(requesterId, addresseeId);
  if (existing) throw new ConflictError("A connection request already exists between these users");
  const result = await connectionRepository.create(requesterId, addresseeId, message);

  try {
    await notificationRepository.create(addresseeId, "connection_request", {
      connectionId: result.id,
      requesterId,
      message,
    });
  } catch {
    // Non-blocking notification side effect
  }

  return result;
}

/** Only the addressee can accept/decline; either party can block. */
export async function updateStatus(userId: string, id: string, status: ConnectionStatus) {
  const connection = await connectionRepository.findById(id);
  if (!connection) throw new NotFoundError("Connection request not found");

  if (status === "blocked") {
    if (connection.requesterId !== userId && connection.addresseeId !== userId) {
      throw new ForbiddenError("You are not part of this connection");
    }
  } else if (connection.addresseeId !== userId) {
    throw new ForbiddenError("Only the recipient can respond to this connection request");
  }

  const updated = await connectionRepository.updateStatus(id, status);

  if (status === "accepted") {
    try {
      await notificationRepository.create(connection.requesterId, "connection_request", {
        connectionId: connection.id,
        responderId: userId,
        status: "accepted",
      });
    } catch {
      // Non-blocking notification side effect
    }
  }

  return updated;
}

export async function list(
  userId: string,
  cursor: string | undefined,
  limit: number,
  status?: string,
) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await connectionRepository.list(userId, { skip, take, status });
  return buildPaginatedResponse(items, skip, take);
}
