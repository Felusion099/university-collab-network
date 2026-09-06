import { prisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export class OpportunityRepository {
  async list(params: {
    skip: number;
    take: number;
    type?: string;
    department?: string;
    deadlineBefore?: string;
    skill?: string;
  }) {
    const where: Prisma.OpportunityWhereInput = {};
    if (params.type)
      where.opportunityType = params.type as Prisma.EnumOpportunityTypeFilter["equals"];
    if (params.department) where.departmentTag = params.department;
    if (params.deadlineBefore) where.deadline = { lte: new Date(params.deadlineBefore) };
    return prisma.opportunity.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { deadline: "asc" },
      include: { providedByOrganization: true, providedByResearchTeam: true, researchTopic: true },
    });
  }

  async findById(id: string) {
    return prisma.opportunity.findUnique({
      where: { id },
      include: { providedByOrganization: true, providedByResearchTeam: true, researchTopic: true },
    });
  }

  async create(data: Prisma.OpportunityCreateInput) {
    return prisma.opportunity.create({ data });
  }

  async update(id: string, data: Prisma.OpportunityUpdateInput) {
    return prisma.opportunity.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.opportunity.delete({ where: { id } });
  }

  async canManage(opportunityId: string, userId: string) {
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) return false;
    if (opp.providedByOrganizationId) {
      const membership = await prisma.membership.findFirst({
        where: {
          organizationId: opp.providedByOrganizationId,
          userId,
          role: { in: ["leader", "founder", "advisor"] },
        },
      });
      return Boolean(membership);
    }
    if (opp.providedByResearchTeamId) {
      const team = await prisma.researchTeam.findFirst({
        where: { id: opp.providedByResearchTeamId, piUserId: userId },
      });
      return Boolean(team);
    }
    return false;
  }

  async createApplication(opportunityId: string, applicantId: string) {
    return prisma.application.create({ data: { opportunityId, applicantId } });
  }

  async findApplication(opportunityId: string, applicantId: string) {
    return prisma.application.findFirst({ where: { opportunityId, applicantId } });
  }

  async updateApplication(id: string, status: string) {
    return prisma.application.update({
      where: { id },
      data: { status: status as Prisma.ApplicationUpdateInput["status"] },
    });
  }
}

export const opportunityRepository = new OpportunityRepository();
