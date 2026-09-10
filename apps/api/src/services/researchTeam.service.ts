import { researchTeamRepository } from "../repositories/researchTeam.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateResearchTeamRequest, UpdateResearchTeamRequest } from "@app/shared-types";

export async function list(params: { cursor?: string; limit: number; topic?: string }) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await researchTeamRepository.list({ skip, take, topic: params.topic });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const team = await researchTeamRepository.findById(id);
  if (!team) throw new NotFoundError("Research team not found");
  return team;
}

export async function create(userId: string, input: CreateResearchTeamRequest) {
  return researchTeamRepository.create({
    name: input.name,
    description: input.description,
    pi: { connect: { id: userId } },
    creator: { connect: { id: userId } },
    memberships: { create: { userId, role: "pi" } },
    researchTeamTopics: input.topicIds
      ? {
          create: input.topicIds.map((researchTopicId) => ({
            researchTopic: { connect: { id: researchTopicId } },
          })),
        }
      : undefined,
  });
}

async function assertCanManage(researchTeamId: string, userId: string) {
  const team = await prisma.researchTeam.findFirst({
    where: { id: researchTeamId, OR: [{ piUserId: userId }, { createdBy: userId }] },
  });
  if (!team) throw new ForbiddenError("You do not have permission to manage this research team");
}

export async function update(userId: string, id: string, input: UpdateResearchTeamRequest) {
  const existing = await researchTeamRepository.findById(id);
  if (!existing) throw new NotFoundError("Research team not found");
  await assertCanManage(id, userId);
  return researchTeamRepository.update(id, {
    name: input.name,
    description: input.description,
    pi: { connect: { id: userId } },
  });
}

export async function remove(userId: string, id: string) {
  const existing = await researchTeamRepository.findById(id);
  if (!existing) throw new NotFoundError("Research team not found");
  await assertCanManage(id, userId);
  await researchTeamRepository.delete(id);
}

export async function join(userId: string, researchTeamId: string) {
  const existing = await researchTeamRepository.findById(researchTeamId);
  if (!existing) throw new NotFoundError("Research team not found");
  const already = await researchTeamRepository.isMember(researchTeamId, userId);
  if (already) throw new ConflictError("Already a member of this research team");
  return prisma.membership.create({ data: { researchTeamId, userId, role: "member" } });
}

export async function leave(userId: string, researchTeamId: string) {
  const membership = await prisma.membership.findFirst({ where: { researchTeamId, userId } });
  if (!membership) throw new NotFoundError("Membership not found");
  await prisma.membership.delete({ where: { id: membership.id } });
}
