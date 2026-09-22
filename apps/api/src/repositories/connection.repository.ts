import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class ConnectionRepository {
  async create(requesterId: string, addresseeId: string, message: string) {
    return prisma.connection.create({
      data: { requesterId, addresseeId, message },
      include: { requester: { select: SAFE_USER_SELECT }, addressee: { select: SAFE_USER_SELECT } },
    });
  }

  async findById(id: string) {
    return prisma.connection.findUnique({
      where: { id },
      include: { requester: { select: SAFE_USER_SELECT }, addressee: { select: SAFE_USER_SELECT } },
    });
  }

  async findBetween(userA: string, userB: string) {
    return prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.connection.update({
      where: { id },
      data: { status: status as Prisma.ConnectionUpdateInput["status"] },
      include: {
        requester: { select: SAFE_USER_SELECT },
        addressee: { select: SAFE_USER_SELECT },
      },
    });
  }

  async areConnected(userA: string, userB: string) {
    const conn = await this.findBetween(userA, userB);
    return conn?.status === "accepted";
  }

  async remove(id: string) {
    return prisma.connection.delete({ where: { id } });
  }

  async list(userId: string, params: { skip: number; take: number; status?: string }) {
    const where: Prisma.ConnectionWhereInput = {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    };
    if (params.status) where.status = params.status as Prisma.EnumConnectionStatusFilter["equals"];
    return prisma.connection.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { createdAt: "desc" },
      include: { requester: { select: SAFE_USER_SELECT }, addressee: { select: SAFE_USER_SELECT } },
    });
  }
}

export const connectionRepository = new ConnectionRepository();
