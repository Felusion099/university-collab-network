import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class EventRepository {
  async list(params: { skip: number; take: number; eventType?: string; upcoming?: boolean }) {
    const where: Prisma.EventWhereInput = {};
    if (params.eventType)
      where.eventType = params.eventType as Prisma.EnumEventTypeFilter["equals"];
    if (params.upcoming) where.date = { gte: new Date() };
    return prisma.event.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { date: "asc" },
      include: { organizerOrganization: true, organizerResearchTeam: true },
    });
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        organizerOrganization: true,
        organizerResearchTeam: true,
        participants: { include: { user: { select: SAFE_USER_SELECT } } },
      },
    });
  }

  async create(data: Prisma.EventCreateInput) {
    return prisma.event.create({
      data,
      include: { organizerOrganization: true, organizerResearchTeam: true },
    });
  }

  async update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.event.delete({ where: { id } });
  }

  async register(eventId: string, userId: string) {
    return prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
  }

  async canManage(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return false;
    if (event.organizerOrganizationId) {
      const membership = await prisma.membership.findFirst({
        where: {
          organizationId: event.organizerOrganizationId,
          userId,
          role: { in: ["leader", "founder", "advisor"] },
        },
      });
      return Boolean(membership);
    }
    if (event.organizerResearchTeamId) {
      const team = await prisma.researchTeam.findFirst({
        where: { id: event.organizerResearchTeamId, piUserId: userId },
      });
      return Boolean(team);
    }
    return false;
  }
}

export const eventRepository = new EventRepository();
