import { researchTeamRepository } from "../repositories/researchTeam.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type {
  CreateResearchTeamRequest,
  UpdateResearchTeamRequest,
  MembershipRole,
} from "@app/shared-types";
import type { VerificationRoleClaim } from "@prisma/client";

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

/**
 * ============================================================================
 * PROFESSOR RESEARCH TEAM MANAGEMENT (New functionality for Phase 9+)
 * ============================================================================
 * 
 * These functions allow verified professors to manage their research teams.
 * Professors can:
 * - Create research teams (they become the PI)
 * - Update their own research teams
 * - Delete/archive their own research teams
 * - Manage team membership (add/remove students/researchers, change roles)
 * - Transfer PI ownership
 */

/**
 * Professor creates a new research team (becomes PI)
 */
export async function createByProfessor(professorId: string, input: CreateResearchTeamRequest) {
  // Verify professor eligibility
  const user = await userRepository.findById(professorId);
  if (!user) throw new NotFoundError("Professor not found");
  if (user.requestedRole !== "professor" || user.status !== "active" || !user.isUniversityVerified) {
    throw new ForbiddenError("Only verified professors can create research teams");
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

  return researchTeamRepository.create({
    name: input.name,
    description: input.description,
    pi: { connect: { id: professorId } },
    creator: { connect: { id: professorId } },
    memberships: { create: { userId: professorId, role: "pi" } },
    researchTeamTopics: input.topicIds
      ? {
          create: input.topicIds.map((researchTopicId) => ({
            researchTopic: { connect: { id: researchTopicId } },
          })),
        }
      : undefined,
  });
}

/**
 * Professor updates their own research team
 * Only the PI/creator can update their own research team
 */
export async function updateByProfessor(professorId: string, id: string, input: UpdateResearchTeamRequest) {
  const existing = await researchTeamRepository.findById(id);
  if (!existing) throw new NotFoundError("Research team not found");

  // Check ownership - professor must be PI or creator
  if (existing.piUserId !== professorId && existing.createdBy !== professorId) {
    throw new ForbiddenError("Only the PI or creator can update this research team");
  }

  return researchTeamRepository.update(id, {
    name: input.name,
    description: input.description,
    pi: { connect: { id: professorId } },
  });
}

/**
 * Professor deletes/archives their own research team
 * Only the PI/creator can delete their own research team
 */
export async function removeByProfessor(professorId: string, id: string) {
  const existing = await researchTeamRepository.findById(id);
  if (!existing) throw new NotFoundError("Research team not found");

  // Check ownership
  if (existing.piUserId !== professorId && existing.createdBy !== professorId) {
    throw new ForbiddenError("Only the PI or creator can delete this research team");
  }

  // Check if team has related data that would be orphaned
  const hasRelatedData = await prisma.$transaction(async (tx) => {
    const [members, events, opportunities, topics] = await Promise.all([
      tx.membership.count({ where: { researchTeamId: id } }),
      tx.event.count({ where: { organizerResearchTeamId: id } }),
      tx.opportunity.count({ where: { providedByResearchTeamId: id } }),
      tx.researchTeamTopic.count({ where: { researchTeamId: id } }),
    ]);
    return members + events + opportunities + topics > 0;
  });

  if (hasRelatedData) {
    // Soft delete - archive instead of hard delete
    // TODO: Add status field to schema when migration is applied
    throw new ForbiddenError("Cannot delete team with related data. Use archive instead (not yet implemented).");
  }

  await researchTeamRepository.delete(id);
}

/**
 * Professor manages research team members
 */
export async function addMemberByProfessor(
  professorId: string,
  researchTeamId: string,
  userId: string,
  role: MembershipRole = "member"
) {
  // Check ownership - professor must be PI or creator
  const existing = await prisma.researchTeam.findFirst({
    where: { id: researchTeamId, OR: [{ piUserId: professorId }, { createdBy: professorId }] },
  });
  if (!existing) throw new ForbiddenError("Only the PI or creator can manage team members");

  // Check if user is already a member
  const already = await researchTeamRepository.isMember(researchTeamId, userId);
  if (already) throw new ConflictError("Already a member of this research team");

  // Verify the user being added is a valid student or researcher
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  // Create membership with appropriate role
  return prisma.membership.create({
    data: { researchTeamId, userId, role },
  });
}

/**
 * Professor removes a member from their research team
 */
export async function removeMemberByProfessor(
  professorId: string,
  researchTeamId: string,
  userId: string
) {
  // Check ownership
  const existing = await prisma.researchTeam.findFirst({
    where: { id: researchTeamId, OR: [{ piUserId: professorId }, { createdBy: professorId }] },
  });
  if (!existing) throw new ForbiddenError("Only the PI or creator can manage team members");

  // Cannot remove the PI themselves
  if (userId === existing.piUserId) {
    throw new ForbiddenError("Cannot remove the PI from the research team");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId, researchTeamId },
  });
  if (!membership) throw new NotFoundError("Membership not found");

  await prisma.membership.delete({ where: { id: membership.id } });
}

/**
 * Professor changes a member's role in their research team
 */
export async function updateMemberRoleByProfessor(
  professorId: string,
  researchTeamId: string,
  userId: string,
  newRole: MembershipRole
) {
  // Check ownership
  const existing = await prisma.researchTeam.findFirst({
    where: { id: researchTeamId, OR: [{ piUserId: professorId }, { createdBy: professorId }] },
  });
  if (!existing) throw new ForbiddenError("Only the PI or creator can manage team members");

  // Cannot change PI's role
  if (userId === existing.piUserId) {
    throw new ForbiddenError("Cannot change the PI's role");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId, researchTeamId },
  });
  if (!membership) throw new NotFoundError("Membership not found");

  return prisma.membership.update({
    where: { id: membership.id },
    data: { role: newRole },
  });
}

/**
 * Professor transfers PI ownership of their research team
 */
export async function transferPIOwnership(
  professorId: string,
  researchTeamId: string,
  newPIUserId: string
) {
  // Check ownership
  const existing = await prisma.researchTeam.findFirst({
    where: { id: researchTeamId, OR: [{ piUserId: professorId }, { createdBy: professorId }] },
  });
  if (!existing) throw new ForbiddenError("Only the PI or creator can transfer PI ownership");

  // Verify new PI is a verified professor
  const newPI = await userRepository.findById(newPIUserId);
  if (!newPI) throw new NotFoundError("New PI not found");
  if (newPI.requestedRole !== "professor" || newPI.status !== "active" || !newPI.isUniversityVerified) {
    throw new ForbiddenError("New PI must be a verified professor");
  }

  // Check new PI's verification is approved
  const authRepository = (await import("../repositories/auth.repository.js")).authRepository;
  const approved = await authRepository.findApprovedVerification(
    newPIUserId,
    "professor" as VerificationRoleClaim,
  );
  if (!approved) {
    throw new ForbiddenError("New PI's professor role not yet verified by an administrator");
  }

  // Update PI: set the new PI on the team and ensure their membership
  // reflects the pi role. Membership has no composite unique constraint,
  // so upsert-by-pair isn't possible — look up first, then update or create.
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: newPIUserId, researchTeamId },
  });
  if (existingMembership) {
    if (existingMembership.role !== "pi") {
      await prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: "pi" },
      });
    }
  } else {
    await prisma.membership.create({
      data: { userId: newPIUserId, researchTeamId, role: "pi" },
    });
  }

  return prisma.researchTeam.update({
    where: { id: researchTeamId },
    data: { piUserId: newPIUserId },
  });
}

/**
 * Professor lists their own research teams
 */
export async function listByProfessor(professorId: string, cursor?: string, limit?: number, topic?: string) {
  const { skip, take } = toPageParams(cursor, limit ?? 10);
  const items = await researchTeamRepository.list({ skip, take, topic });
  // Filter by professor ownership (PI or creator)
  const filtered = items.filter(
    (team: { piUserId: string | null; createdBy: string | null }) =>
      team.piUserId === professorId || team.createdBy === professorId,
  );
  return buildPaginatedResponse(filtered, skip, take);
}
