import { prisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export class NotificationRepository {
  async list(userId: string, params: { skip: number; take: number; unreadOnly?: boolean }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (params.unreadOnly) where.readAt = null;
    return prisma.notification.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async create(userId: string, type: string, payload: object) {
    return prisma.notification.create({
      data: { userId, type: type as Prisma.NotificationCreateInput["type"], payload },
    });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreferences.findUnique({ where: { userId } });
  }

  async upsertPreferences(
    userId: string,
    data: Prisma.NotificationPreferencesUncheckedUpdateInput,
  ) {
    const createData = {
      ...(data as Prisma.NotificationPreferencesUncheckedCreateInput),
      userId,
    };
    return prisma.notificationPreferences.upsert({
      where: { userId },
      create: createData,
      update: data,
    });
  }
}

export const notificationRepository = new NotificationRepository();
