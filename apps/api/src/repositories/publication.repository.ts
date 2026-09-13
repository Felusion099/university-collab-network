import { prisma } from "./prisma.js";
import { SAFE_USER_SELECT } from "../utils/prismaSelects.js";
import type { Prisma } from "@prisma/client";

export class PublicationRepository {
  async list(params: { skip: number; take: number; topic?: string; authorId?: string }) {
    const where: Prisma.PublicationWhereInput = {};
    if (params.topic) {
      where.topics = { some: { researchTopic: { slug: params.topic } } };
    }
    if (params.authorId) {
      where.authors = { some: { userId: params.authorId } };
    }
    return prisma.publication.findMany({
      where,
      skip: params.skip,
      take: params.take + 1,
      orderBy: { publishedDate: "desc" },
      include: {
        authors: { include: { user: { select: SAFE_USER_SELECT } } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.publication.findUnique({
      where: { id },
      include: {
        authors: { include: { user: { select: SAFE_USER_SELECT } } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async create(data: Prisma.PublicationCreateInput, authorIds: string[], topicIds: string[] = []) {
    return prisma.publication.create({
      data: {
        ...data,
        authors: {
          create: authorIds.map((userId, idx) => ({
            authorOrder: idx + 1,
            user: { connect: { id: userId } },
          })),
        },
        topics: {
          create: topicIds.map((researchTopicId) => ({
            researchTopic: { connect: { id: researchTopicId } },
          })),
        },
      },
      include: {
        authors: { include: { user: { select: SAFE_USER_SELECT } } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async update(id: string, data: Prisma.PublicationUpdateInput) {
    return prisma.publication.update({
      where: { id },
      data,
      include: {
        authors: { include: { user: { select: SAFE_USER_SELECT } } },
        topics: { include: { researchTopic: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.publication.delete({ where: { id } });
  }

  async isAuthor(publicationId: string, userId: string) {
    const row = await prisma.publicationAuthor.findUnique({
      where: { publicationId_userId: { publicationId, userId } },
    });
    return Boolean(row);
  }
}

export const publicationRepository = new PublicationRepository();
