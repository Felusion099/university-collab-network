import { publicationRepository } from "../repositories/publication.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreatePublicationRequest, UpdatePublicationRequest } from "@app/shared-types";
import type { VerificationRoleClaim } from "@prisma/client";

export async function list(params: { cursor?: string; limit: number; topic?: string }) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await publicationRepository.list({ skip, take, topic: params.topic });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const pub = await publicationRepository.findById(id);
  if (!pub) throw new NotFoundError("Publication not found");
  return pub;
}

/** The creating user must be one of the listed authors — prevents attributing a publication to people who never agreed to it. */
export async function create(userId: string, input: CreatePublicationRequest) {
  if (!input.authorIds.includes(userId)) {
    throw new ForbiddenError("You must include yourself as an author to create a publication");
  }
  return publicationRepository.create(
    {
      title: input.title,
      abstract: input.abstract,
      journalOrConference: input.journalOrConference,
      publishedDate: input.publishedDate ? new Date(input.publishedDate) : undefined,
      doi: input.doi,
      externalUrl: input.externalUrl,
      pdfUrl: input.pdfUrl,
    },
    input.authorIds,
    input.topicIds ?? [],
  );
}

export async function update(userId: string, id: string, input: UpdatePublicationRequest) {
  const existing = await publicationRepository.findById(id);
  if (!existing) throw new NotFoundError("Publication not found");
  const isAuthor = await publicationRepository.isAuthor(id, userId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can edit this publication");
  return publicationRepository.update(id, {
    title: input.title,
    abstract: input.abstract,
    journalOrConference: input.journalOrConference,
    publishedDate: input.publishedDate ? new Date(input.publishedDate) : undefined,
    doi: input.doi,
    externalUrl: input.externalUrl,
    pdfUrl: input.pdfUrl,
  });
}

export async function remove(userId: string, id: string) {
  const existing = await publicationRepository.findById(id);
  if (!existing) throw new NotFoundError("Publication not found");
  const isAuthor = await publicationRepository.isAuthor(id, userId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can delete this publication");
  await publicationRepository.delete(id);
}

/**
 * ============================================================================
 * PROFESSOR PUBLICATION MANAGEMENT (New functionality for Phase 9+)
 * ============================================================================
 * 
 * These functions allow verified professors to manage their publications.
 * Ownership is determined by authorship (professor must be listed as an author).
 */

/**
 * Professor creates a publication (must include themselves as author)
 */
export async function createByProfessor(professorId: string, input: CreatePublicationRequest) {
  // Verify professor eligibility
  const user = await userRepository.findById(professorId);
  if (!user) throw new NotFoundError("Professor not found");
  if (user.requestedRole !== "professor" || user.status !== "active" || !user.isUniversityVerified) {
    throw new ForbiddenError("Only verified professors can create publications");
  }

  // Check professor profile exists and verification is approved
  const professorProfile = await userRepository.findProfessorProfile(professorId);
  if (!professorProfile) {
    throw new ForbiddenError("Professor profile not found");
  }

  // Check verification is approved
  const authRepository = (await import("../repositories/auth.repository.js")).authRepository;
  const approved = await authRepository.findApprovedVerification(
    professorId,
    "professor" as VerificationRoleClaim,
  );
  if (!approved) {
    throw new ForbiddenError("Professor role not yet verified by an administrator");
  }

  // Professor must include themselves as an author
  if (!input.authorIds.includes(professorId)) {
    throw new ForbiddenError("Professor must include themselves as an author");
  }

  return publicationRepository.create(
    {
      title: input.title,
      abstract: input.abstract,
      journalOrConference: input.journalOrConference,
      publishedDate: input.publishedDate ? new Date(input.publishedDate) : undefined,
      doi: input.doi,
      externalUrl: input.externalUrl,
      pdfUrl: input.pdfUrl,
    },
    input.authorIds,
    input.topicIds ?? [],
  );
}

/**
 * Professor updates their publication (must be an author)
 */
export async function updateByProfessor(professorId: string, id: string, input: UpdatePublicationRequest) {
  const existing = await publicationRepository.findById(id);
  if (!existing) throw new NotFoundError("Publication not found");
  
  const isAuthor = await publicationRepository.isAuthor(id, professorId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can edit this publication");
  
  return publicationRepository.update(id, {
    title: input.title,
    abstract: input.abstract,
    journalOrConference: input.journalOrConference,
    publishedDate: input.publishedDate ? new Date(input.publishedDate) : undefined,
    doi: input.doi,
    externalUrl: input.externalUrl,
    pdfUrl: input.pdfUrl,
  });
}

/**
 * Professor removes their publication (must be an author)
 * Uses soft-delete when appropriate
 */
export async function removeByProfessor(professorId: string, id: string) {
  const existing = await publicationRepository.findById(id);
  if (!existing) throw new NotFoundError("Publication not found");
  
  const isAuthor = await publicationRepository.isAuthor(id, professorId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can delete this publication");
  
  await publicationRepository.delete(id);
}

/**
 * Professor adds a co-author to their publication
 */
export async function addAuthorByProfessor(
  professorId: string,
  publicationId: string,
  authorId: string,
  authorOrder: number
) {
  // Check authorship
  const isAuthor = await publicationRepository.isAuthor(publicationId, professorId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can add co-authors");

  // Verify the user being added exists
  const user = await userRepository.findById(authorId);
  if (!user) throw new NotFoundError("User not found");

  // Check if already an author
  const isAlreadyAuthor = await publicationRepository.isAuthor(publicationId, authorId);
  if (isAlreadyAuthor) {
    throw new ConflictError("User is already an author of this publication");
  }

  // Add author with specified order
  // This would require updating the publicationRepository to support adding authors
  // For now, we'll use a direct prisma call
  // Shift existing authors' order if needed
  await prisma.publicationAuthor.updateMany({
    where: {
      publicationId,
      authorOrder: { gte: authorOrder },
    },
    data: { authorOrder: { increment: 1 } },
  });

  return prisma.publicationAuthor.create({
    data: {
      publicationId,
      userId: authorId,
      authorOrder,
    },
  });
}

/**
 * Professor removes an author from their publication
 */
export async function removeAuthorByProfessor(
  professorId: string,
  publicationId: string,
  authorId: string
) {
  // Check authorship
  const isAuthor = await publicationRepository.isAuthor(publicationId, professorId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can remove co-authors");

  // Cannot remove yourself as the last author
  const authorCount = await prisma.publicationAuthor.count({
    where: { publicationId },
  });
  if (authorId === professorId && authorCount <= 1) {
    throw new ForbiddenError("Cannot remove yourself as the sole author");
  }

  // Cannot remove the primary author (authorOrder = 1) unless you're the primary author
  const targetAuthorship = await prisma.publicationAuthor.findUnique({
    where: { publicationId_userId: { publicationId, userId: authorId } },
  });
  if (!targetAuthorship) throw new NotFoundError("Author not found on this publication");
  
  if (targetAuthorship.authorOrder === 1 && authorId !== professorId) {
    throw new ForbiddenError("Cannot remove the primary author unless you are the primary author");
  }

  await prisma.publicationAuthor.delete({
    where: { publicationId_userId: { publicationId, userId: authorId } },
  });

  // Reorder remaining authors
  await prisma.publicationAuthor.updateMany({
    where: {
      publicationId,
      authorOrder: { gt: targetAuthorship.authorOrder },
    },
    data: { authorOrder: { decrement: 1 } },
  });
}

/**
 * Professor updates author order in their publication
 */
export async function updateAuthorOrderByProfessor(
  professorId: string,
  publicationId: string,
  authorId: string,
  newOrder: number
) {
  // Check authorship
  const isAuthor = await publicationRepository.isAuthor(publicationId, professorId);
  if (!isAuthor) throw new ForbiddenError("Only a listed author can modify author order");

  // Validate new order
  const authorCount = await prisma.publicationAuthor.count({
    where: { publicationId },
  });
  if (newOrder < 1 || newOrder > authorCount) {
    throw new ForbiddenError(`Invalid author order. Must be between 1 and ${authorCount}`);
  }

  const targetAuthorship = await prisma.publicationAuthor.findUnique({
    where: { publicationId_userId: { publicationId, userId: authorId } },
  });
  if (!targetAuthorship) throw new NotFoundError("Author not found on this publication");

  const oldOrder = targetAuthorship.authorOrder;
  if (oldOrder === newOrder) return; // No change needed

  if (oldOrder < newOrder) {
    // Moving down - shift others up
    await prisma.publicationAuthor.updateMany({
      where: {
        publicationId,
        authorOrder: { gt: oldOrder, lte: newOrder },
      },
      data: { authorOrder: { decrement: 1 } },
    });
  } else {
    // Moving up - shift others down
    await prisma.publicationAuthor.updateMany({
      where: {
        publicationId,
        authorOrder: { gte: newOrder, lt: oldOrder },
      },
      data: { authorOrder: { increment: 1 } },
    });
  }

  return prisma.publicationAuthor.update({
    where: { publicationId_userId: { publicationId, userId: authorId } },
    data: { authorOrder: newOrder },
  });
}

/**
 * Professor lists their own publications
 */
export async function listByProfessor(professorId: string, cursor?: string, limit?: number) {
  const { skip, take } = toPageParams(cursor, limit ?? 10);
  const items = await publicationRepository.list({ skip, take, authorId: professorId });
  return buildPaginatedResponse(items, skip, take);
}
