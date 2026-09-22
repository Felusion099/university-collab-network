import { prisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export class NoticeRepository {
  async list(params: { skip: number; take: number; pinnedFirst?: boolean }) {
    return prisma.notice.findMany({
      where: {},
      skip: params.skip,
      take: params.take + 1,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.notice.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true, requestedRole: true } } },
    });
  }

  async create(authorId: string, data: Omit<Prisma.NoticeUncheckedCreateInput, "authorId">) {
    return prisma.notice.create({
      data: { ...data, authorId },
      include: { author: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } } },
    });
  }

  async update(id: string, data: Prisma.NoticeUncheckedUpdateInput) {
    return prisma.notice.update({
      where: { id },
      data,
      include: { author: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } } },
    });
  }

  async remove(id: string) {
    await prisma.notice.delete({ where: { id } });
  }

  async count() {
    return prisma.notice.count();
  }
}

export const noticeRepository = new NoticeRepository();
