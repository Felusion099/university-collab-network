import { publicationRepository } from "../repositories/publication.repository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreatePublicationRequest, UpdatePublicationRequest } from "@app/shared-types";

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
