import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class ResearchTopicRepository {
  async list(params: { skip: number; take: number }) {
    return prisma.researchTopic.findMany({
      skip: params.skip,
      take: params.take + 1,
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.researchTopic.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.researchTopic.findUnique({
      where: { slug },
      include: {
        childTopics: true,
        parentTopic: true,
        researchTeamTopics: {
          include: {
            researchTeam: {
              include: {
                events: true,
              },
            },
          },
        },
        userResearchTopics: {
          include: {
            // select, not include, per DECISIONS.md D-019 — never expose
            // passwordHash/email/phone/universityDomain in this reverse
            // (topic -> interested users) listing. privacySettings is
            // included so researchTopic.service.ts can apply the same
            // researchVisibility gate + per-field profile filtering
            // (cgpa/social links/academic info) that profile.service.ts
            // already applies on the direct GET /users/:username path.
            user: {
              select: {
                ...SAFE_USER_SELECT,
                studentProfile: true,
                professorProfile: true,
                researcherProfile: true,
                privacySettings: true,
              },
            },
          },
        },
        publicationTopics: {
          include: {
            publication: {
              include: {
                authors: {
                  include: {
                    user: { select: SAFE_USER_SELECT },
                  },
                },
              },
            },
          },
        },
        projectTopics: {
          include: {
            project: true,
          },
        },
        opportunities: true,
      },
    });
  }

  async create(data: Prisma.ResearchTopicCreateInput) {
    return prisma.researchTopic.create({ data });
  }

  async update(id: string, data: Prisma.ResearchTopicUpdateInput) {
    return prisma.researchTopic.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.researchTopic.delete({ where: { id } });
  }
}

export const researchTopicRepository = new ResearchTopicRepository();
