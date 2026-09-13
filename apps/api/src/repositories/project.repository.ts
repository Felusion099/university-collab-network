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
  }) {
    const where: Prisma.ProjectWhereInput = {};
    if (params.status) where.status = params.status as Prisma.EnumProjectStatusFilter["equals"];
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
