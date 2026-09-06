import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class ResearchTeamRepository {
  async list(params: { skip: number; take: number; topic?: string }) {
    const where: Prisma.ResearchTeamWhereInput = {};
    if (params.topic) {
      where.researchTeamTopics = { some: { researchTopic: { slug: params.topic } } };
    }
    return prisma.researchTeam.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { name: "asc" },
      include: {
        pi: { select: SAFE_USER_SELECT },
        researchTeamTopics: { include: { researchTopic: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.researchTeam.findUnique({
      where: { id },
      include: {
        pi: { select: SAFE_USER_SELECT },
        memberships: { include: { user: { select: SAFE_USER_SELECT } } },
        researchTeamTopics: { include: { researchTopic: true } },
      },
    });
  }

  async create(data: Prisma.ResearchTeamCreateInput) {
    return prisma.researchTeam.create({ data, include: { pi: { select: SAFE_USER_SELECT } } });
  }

  async update(id: string, data: Prisma.ResearchTeamUpdateInput) {
    return prisma.researchTeam.update({
      where: { id },
      data,
      include: { pi: { select: SAFE_USER_SELECT } },
    });
  }

  async delete(id: string) {
    return prisma.researchTeam.delete({ where: { id } });
  }

  async isMember(researchTeamId: string, userId: string) {
    const team = await prisma.researchTeam.findFirst({
      where: {
        id: researchTeamId,
        OR: [{ piUserId: userId }, { memberships: { some: { userId } } }],
      },
    });
    return Boolean(team);
  }
}

export const researchTeamRepository = new ResearchTeamRepository();
