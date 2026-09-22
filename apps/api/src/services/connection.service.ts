import { prisma } from "../repositories/prisma.js";
import { connectionRepository } from "../repositories/connection.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError, RateLimitError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { ConnectionStatus } from "@app/shared-types";

/**
 * Connection service — a professional connection model separate from
 * follows / project collaboration / community membership / messaging.
 *
 * States: no connection → request sent → request received → connected;
 * declined/cancelled return to "no connection" (the request history
 * remains for the rate limit).
 *
 * Rate limit: max 3 connection requests per week to the same person,
 * enforced server-side via connection_request_history — every request
 * event (including recreate-after-cancel) logs a row, so repeated
 * cancel-and-recreate cycles count toward the limit.
 */

const RATE_LIMIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // one week
const RATE_LIMIT_MAX_REQUESTS = 3;

async function findExisting(userId: string, otherId: string) {
  const a = await connectionRepository.findBetween(userId, otherId);
  if (a) return a;
  return connectionRepository.findBetween(otherId, userId);
}

async function assertRateLimit(requesterId: string, addresseeId: string) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await prisma.connectionRequestHistory.count({
    where: { requesterId, addresseeId, createdAt: { gte: since } },
  });
  if (recent >= RATE_LIMIT_MAX_REQUESTS) {
    throw new RateLimitError(
      `Connection request limit reached — you can send at most ${RATE_LIMIT_MAX_REQUESTS} requests per week to the same person`,
    );
  }
}

export async function create(requesterId: string, addresseeId: string, message?: string) {
  if (requesterId === addresseeId) throw new BadRequestError("You cannot connect with yourself");

  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: { id: true, status: true },
  });
  if (!addressee) throw new NotFoundError("User not found");
  if (addressee.status === "suspended" || addressee.status === "banned") {
    throw new ForbiddenError("This user cannot receive connection requests");
  }

  // Server-side rate limit — every request event (including recreates
  // after cancel/decline) counts toward the 3/week limit
  await assertRateLimit(requesterId, addresseeId);

  const existing = await findExisting(requesterId, addresseeId);
  if (existing) {
    if (existing.status === "accepted") {
      throw new ConflictError("You are already connected with this user");
    }
    if (existing.status === "blocked") {
      throw new ForbiddenError("This connection is blocked");
    }
    if (existing.status === "pending") {
      if (existing.requesterId === requesterId) {
        throw new ConflictError("You already have a pending connection request to this user");
      }
      // The recipient re-requesting their own incoming pending request — no-op
      throw new ConflictError("This user has already sent you a connection request — respond to it instead");
    }
    if (existing.status === "declined") {
      // Re-request after a decline: revive the row (the pair is unique)
      const revived = await connectionRepository.updateStatus(existing.id, "pending");
      await prisma.connectionRequestHistory.create({
        data: { requesterId, addresseeId },
      });
      await notifyRequest(addresseeId, revived.id, requesterId, message);
      return revived;
    }
  }

  const result = await connectionRepository.create(requesterId, addresseeId, message ?? "");
  await prisma.connectionRequestHistory.create({
    data: { requesterId, addresseeId },
  });
  await notifyRequest(addresseeId, result.id, requesterId, message);

  return result;
}

async function notifyRequest(addresseeId: string, connectionId: string, requesterId: string, message?: string) {
  try {
    await notificationRepository.create(addresseeId, "connection_request", {
      connectionId,
      requesterId,
      message: message ?? "",
    });
  } catch {
    // Non-blocking notification side effect
  }
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

/** Cancel an outgoing pending request — sender only. The pair returns to
 * "no connection"; the recreate (a new POST) counts toward the rate limit. */
export async function cancel(userId: string, id: string) {
  const connection = await connectionRepository.findById(id);
  if (!connection) throw new NotFoundError("Connection request not found");
  if (connection.requesterId !== userId) {
    throw new ForbiddenError("Only the sender can cancel a connection request");
  }
  if (connection.status !== "pending") {
    throw new ConflictError("Only a pending connection request can be cancelled");
  }
  await connectionRepository.remove(id);
  return { cancelled: true };
}

/** Connected-users check — messaging authorization. */
export async function areConnected(userId: string, otherId: string): Promise<boolean> {
  const existing = await findExisting(userId, otherId);
  return existing?.status === "accepted";
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
