import { prisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export class SkillRepository {
  async list(params: { skip: number; take: number; category?: string }) {
    const where: Prisma.SkillWhereInput = {};
    if (params.category) where.category = params.category;
    return prisma.skill.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.skill.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.skill.findUnique({ where: { name } });
  }

  async create(data: Prisma.SkillCreateInput) {
    return prisma.skill.create({ data });
  }
}

export const skillRepository = new SkillRepository();
