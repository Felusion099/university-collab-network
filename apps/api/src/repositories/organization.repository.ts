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

  async getMember(organizationId: string, userId: string) {
    return prisma.membership.findFirst({ where: { organizationId, userId } });
  }

  async updateMember(organizationId: string, userId: string, data: { role?: string; roleTitle?: string }) {
    const membership = await this.getMember(organizationId, userId);
    if (!membership) throw new Error("Membership not found");
    return prisma.membership.update({
      where: { id: membership.id },
      data: data as Prisma.MembershipUncheckedUpdateInput,
    });
  }

  async removeMember(organizationId: string, userId: string) {
    const membership = await this.getMember(organizationId, userId);
    if (!membership) throw new Error("Membership not found");
    await prisma.membership.delete({ where: { id: membership.id } });
  }

  async transferOwnership(organizationId: string, fromUserId: string, toUserId: string) {
    const fromMembership = await this.getMember(organizationId, fromUserId);
    const toMembership = await this.getMember(organizationId, toUserId);
    if (!fromMembership || !toMembership) throw new Error("Membership not found");
    return prisma.$transaction([
      prisma.membership.update({
        where: { id: toMembership.id },
        data: { role: "founder", roleTitle: "President" },
      }),
      prisma.membership.update({
        where: { id: fromMembership.id },
        data: { role: "leader", roleTitle: "Vice President" },
      }),
      prisma.organization.update({
        where: { id: organizationId },
        data: { createdBy: toUserId },
      }),
    ]);
  }
}

export const organizationRepository = new OrganizationRepository();
