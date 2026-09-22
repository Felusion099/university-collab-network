import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class ProjectRepository {
  async list(params: {
    skip: number;
    take: number;
    status?: string;
    skill?: string;
    topic?: string;
    lookingFor?: string;
    createdBy?: string;
    viewerId?: string;
  }) {
    const where: Prisma.ProjectWhereInput = {};
    // Archived (deleted) projects never appear in discovery
    if (params.status) where.status = params.status as Prisma.EnumProjectStatusFilter["equals"];
    else where.status = { not: "archived" };
    if (params.createdBy) where.createdBy = params.createdBy;
    if (params.skill) {
      where.skillsNeeded = { some: { skill: { name: params.skill } } };
    }
    if (params.topic) {
      where.topics = { some: { researchTopic: { slug: params.topic } } };
    }
    if (params.lookingFor) {
      where.skillsNeeded = {
        some: { roleNeeded: params.lookingFor as Prisma.EnumSkillRoleNeededFilter["equals"] },
      };
    }
    // Visibility-aware discovery (public/private post-like behavior):
    // anonymous viewers see public projects only; authenticated viewers
    // additionally see university-restricted/connections-only projects,
    // their OWN private projects, and private projects they are a member of.
    const viewerId = params.viewerId;
    if (params.createdBy) {
      // An explicit creator filter (profile views) — the caller handles
      // self vs other; for others, private projects are excluded.
      if (!viewerId || viewerId !== params.createdBy) {
        if (viewerId) {
          where.visibility = { not: "private" };
        } else {
          where.visibility = "public";
        }
      }
    } else if (!viewerId) {
      where.visibility = "public";
    } else {
      where.OR = [
        { visibility: { not: "private" } },
        { createdBy: viewerId },
        { visibility: "private", members: { some: { userId: viewerId } } },
      ];
    }
    return prisma.project.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: SAFE_USER_SELECT },
        members: { include: { user: { select: SAFE_USER_SELECT } } },
        skillsNeeded: { include: { skill: true } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: SAFE_USER_SELECT },
        members: { include: { user: { select: SAFE_USER_SELECT } } },
        skillsNeeded: { include: { skill: true } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async create(
    data: Prisma.ProjectCreateInput,
    topicIds: string[] = [],
    skillsNeeded: { skillId: string; roleNeeded: string }[] = [],
  ) {
    return prisma.project.create({
      data: {
        ...data,
        topics: {
          create: topicIds.map((researchTopicId) => ({
            researchTopic: { connect: { id: researchTopicId } },
          })),
        },
        skillsNeeded: {
          create: skillsNeeded.map((s) => ({
            skill: { connect: { id: s.skillId } },
            roleNeeded: s.roleNeeded as Prisma.ProjectSkillNeededCreateInput["roleNeeded"],
          })),
        },
      },
      include: {
        creator: { select: SAFE_USER_SELECT },
        skillsNeeded: { include: { skill: true } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        creator: { select: SAFE_USER_SELECT },
        skillsNeeded: { include: { skill: true } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  /** Projects have a `status` enum with `archived` — soft-delete uses this rather than a hard row delete, per API_CONTRACT.md §3's "soft-delete where applicable" (this is the "applicable" case). See DECISIONS.md D-013. */
  /** HARD delete — the database row is removed; dependents cascade. */
  async hardDelete(id: string) {
    await prisma.project.delete({ where: { id } });
  }

  async archive(id: string) {
    return prisma.project.update({ where: { id }, data: { status: "archived" } });
  }

  async isOwnerOrMember(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ createdBy: userId }, { members: { some: { userId } } }],
      },
    });
    return Boolean(project);
  }

  async isOwner(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, createdBy: userId } });
    return Boolean(project);
  }

  /** Candidate pool for the team-builder: active users not already on the project, with their skills/topics for matching.service.ts to score. */
  async findMatchCandidates(projectId: string, excludeUserIds: string[]) {
    return prisma.user.findMany({
      where: {
        status: "active",
        id: { notIn: excludeUserIds },
      },
      include: {
        userSkills: { include: { skill: true } },
        userResearchTopics: { include: { researchTopic: true } },
        studentProfile: true,
        professorProfile: true,
        researcherProfile: true,
        connectionsSent: { where: { status: "accepted" } },
        connectionsReceived: { where: { status: "accepted" } },
      },
      take: 200, // MVP cap — full-scale candidate ranking is a Phase 12 scale concern
    });
  }
}

export const projectRepository = new ProjectRepository();
