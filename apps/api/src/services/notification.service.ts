import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { UpdateNotificationPreferencesRequest } from "@app/shared-types";

export async function list(
  userId: string,
  cursor: string | undefined,
  limit: number,
  unreadOnly?: boolean,
) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await notificationRepository.list(userId, { skip, take, unreadOnly });
  return buildPaginatedResponse(items, skip, take);
}

export async function markRead(userId: string, id: string) {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw new NotFoundError("Notification not found");
  if (notification.userId !== userId)
    throw new ForbiddenError("This notification does not belong to you");
  return notificationRepository.markRead(id);
}

export async function getPreferences(userId: string) {
  const prefs = await notificationRepository.getPreferences(userId);
  if (prefs) return prefs;
  return notificationRepository.upsertPreferences(userId, {});
}

export async function updatePreferences(
  userId: string,
  input: UpdateNotificationPreferencesRequest,
) {
  return notificationRepository.upsertPreferences(userId, input);
}
