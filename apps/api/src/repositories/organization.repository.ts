import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class OrganizationRepository {
  async list(params: {
    skip: number;
    take: number;
    type?: "club" | "society" | "startup";
    category?: string;
  }) {
    const where: Prisma.OrganizationWhereInput = {};
    if (params.type) where.type = params.type;
    if (params.category) where.category = params.category;
    return prisma.organization.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { name: "asc" },
      include: { startupDetails: true },
    });
  }

  async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        startupDetails: true,
        memberships: { include: { user: { select: SAFE_USER_SELECT } } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
      include: {
        startupDetails: true,
        memberships: { include: { user: { select: SAFE_USER_SELECT } } },
      },
    });
  }

  async create(data: Prisma.OrganizationCreateInput) {
    return prisma.organization.create({ data, include: { startupDetails: true } });
  }

  async update(id: string, data: Prisma.OrganizationUpdateInput) {
    return prisma.organization.update({ where: { id }, data, include: { startupDetails: true } });
  }

  async delete(id: string) {
    return prisma.organization.delete({ where: { id } });
  }

  async isMember(organizationId: string, userId: string) {
    const membership = await prisma.membership.findFirst({
      where: { organizationId, userId },
    });
    return Boolean(membership);
  }

  async isLeaderOrFounder(organizationId: string, userId: string) {
    const membership = await prisma.membership.findFirst({
      where: { organizationId, userId, role: { in: ["leader", "founder", "advisor"] } },
    });
    return Boolean(membership);
  }
}

export const organizationRepository = new OrganizationRepository();
