import { noticeRepository } from "../repositories/notice.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateNoticeRequest, UpdateNoticeRequest } from "@app/shared-types";

/**
 * Notice service — official campus notices persisted in the backend.
 * Writes are admin-only (server-verified: requestedRole + an approved
 * admin verification); reads are public.
 */
async function assertAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { requestedRole: true, status: true },
  });
  if (!user || user.requestedRole !== "admin") {
    throw new ForbiddenError("Only administrators can manage notices");
  }
  const approved = await prisma.verification.findFirst({
    where: { userId, roleClaimed: "admin", status: "approved" },
  });
  if (!approved) throw new ForbiddenError("Admin privileges are not verified for this account");
}

export async function list(cursor: string | undefined, limit: number) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await noticeRepository.list({ skip, take });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const notice = await noticeRepository.findById(id);
  if (!notice) throw new NotFoundError("Notice not found");
  return notice;
}

export async function create(userId: string, input: CreateNoticeRequest) {
  await assertAdmin(userId);
  return noticeRepository.create(userId, {
    title: input.title,
    content: input.content,
    priority: input.priority ?? "Notice",
    isPinned: input.priority === "Urgent" ? true : (input.isPinned ?? false),
    linkAction: input.linkAction,
  });
}

export async function update(userId: string, id: string, input: UpdateNoticeRequest) {
  await assertAdmin(userId);
  const existing = await noticeRepository.findById(id);
  if (!existing) throw new NotFoundError("Notice not found");
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.priority !== undefined) {
    data.priority = input.priority;
    if (input.priority === "Urgent") data.isPinned = true;
  }
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;
  if (input.linkAction !== undefined) data.linkAction = input.linkAction;
  return noticeRepository.update(id, data as never);
}

export async function remove(userId: string, id: string) {
  await assertAdmin(userId);
  const existing = await noticeRepository.findById(id);
  if (!existing) throw new NotFoundError("Notice not found");
  await noticeRepository.remove(id);
  return { removed: true };
}
