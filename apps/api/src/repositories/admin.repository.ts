import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT_ADMIN } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class AdminRepository {
  async listVerifications(params: { skip: number; take: number; status?: string }) {
    const where: Prisma.VerificationWhereInput = {};
    if (params.status)
      where.status = params.status as Prisma.EnumVerificationStatusFilter["equals"];
    return prisma.verification.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { createdAt: "asc" },
      include: { user: { select: SAFE_USER_SELECT_ADMIN } },
    });
  }

  async findVerification(id: string) {
    return prisma.verification.findUnique({ where: { id } });
  }

  async updateVerification(id: string, status: "approved" | "rejected", reviewedBy: string) {
    return prisma.verification.update({ where: { id }, data: { status, reviewedBy } });
  }

  async listReports(params: { skip: number; take: number; status?: string }) {
    const where: Prisma.ReportWhereInput = {};
    if (params.status) where.status = params.status as Prisma.EnumReportStatusFilter["equals"];
    return prisma.report.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { createdAt: "asc" },
      include: { reporter: { select: SAFE_USER_SELECT_ADMIN } },
    });
  }

  async findReport(id: string) {
    return prisma.report.findUnique({ where: { id } });
  }

  async updateReport(id: string, status: string, action: string | undefined, reviewedBy: string) {
    return prisma.report.update({
      where: { id },
      data: {
        status: status as Prisma.ReportUpdateInput["status"],
        action: action as Prisma.ReportUpdateInput["action"],
        reviewedBy,
      },
    });
  }

  /**
   * Aggregate counts per PROJECT_SPEC.md §8 / API_CONTRACT.md §9 — deliberately
   * "connections formed" and similar collaboration metrics, not vanity counts
   * (spec §42). Uses accepted connections and non-idea projects as proxies
   * for "collaborations formed" since no dedicated event-log table exists.
   */
  async getMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTeams,
      totalPublications,
      totalOrganizations,
      totalStartups,
      totalEvents,
      collaborationsFormed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.project.count(),
      prisma.researchTeam.count(),
      prisma.publication.count(),
      prisma.organization.count(),
      prisma.organization.count({ where: { type: "startup" } }),
      prisma.event.count(),
      prisma.connection.count({ where: { status: "accepted" } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalProjects,
      totalTeams,
      totalPublications,
      totalOrganizations,
      totalStartups,
      totalEvents,
      collaborationsFormed,
    };
  }
}

export const adminRepository = new AdminRepository();
