import { organizationRepository } from "../repositories/organization.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateOrganizationRequest, UpdateOrganizationRequest } from "@app/shared-types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 0;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function list(params: {
  cursor?: string;
  limit: number;
  type?: "club" | "society" | "startup";
  category?: string;
}) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await organizationRepository.list({
    skip,
    take,
    type: params.type,
    category: params.category,
  });
  return buildPaginatedResponse(items, skip, take);
}

export async function getBySlug(slug: string) {
  const org = await organizationRepository.findBySlug(slug);
  if (!org) throw new NotFoundError("Organization not found");
  return org;
}

export async function create(userId: string, input: CreateOrganizationRequest) {
  // Startup lifecycle: official startup entries are admin-managed — a very
  // early startup idea lives under Projects; only an admin curates the
  // Startups section (ongoing/incubated/graduated stories). Server-side
  // authorization — the frontend's role checks are never sufficient.
  if (input.type === "startup") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { requestedRole: true },
    });
    if (user?.requestedRole !== "admin") {
      throw new ForbiddenError("Only administrators can add startup entries");
    }
    const approved = await prisma.verification.findFirst({
      where: { userId, roleClaimed: "admin", status: "approved" },
    });
    if (!approved) {
      throw new ForbiddenError("Admin privileges are not verified for this account");
    }
  }
  const slug = await uniqueSlug(input.name);
  return organizationRepository.create({
    type: input.type,
    name: input.name,
    slug,
    logoUrl: input.logoUrl,
    description: input.description,
    category: input.category,
    facultyAdvisor: input.facultyAdvisorId
      ? { connect: { id: input.facultyAdvisorId } }
      : undefined,
    creator: { connect: { id: userId } },
    memberships: { create: { userId, role: "founder" } },
    startupDetails:
      input.type === "startup" && input.startupDetails
        ? { create: input.startupDetails }
        : undefined,
  });
}

async function assertCanManage(organizationId: string, userId: string) {
  const canManage = await organizationRepository.isLeaderOrFounder(organizationId, userId);
  if (!canManage)
    throw new ForbiddenError("You do not have permission to manage this organization");
}

export async function update(userId: string, id: string, input: UpdateOrganizationRequest) {
  const existing = await organizationRepository.findById(id);
  if (!existing) throw new NotFoundError("Organization not found");
  await assertCanManage(id, userId);
  return organizationRepository.update(id, {
    name: input.name,
    logoUrl: input.logoUrl,
    description: input.description,
    category: input.category,
    facultyAdvisor: input.facultyAdvisorId
      ? { connect: { id: input.facultyAdvisorId } }
      : undefined,
  });
}

export async function remove(userId: string, id: string) {
  const existing = await organizationRepository.findById(id);
  if (!existing) throw new NotFoundError("Organization not found");
  await assertCanManage(id, userId);
  await organizationRepository.delete(id);
}

export async function join(userId: string, organizationId: string) {
  const existing = await organizationRepository.findById(organizationId);
  if (!existing) throw new NotFoundError("Organization not found");
  const alreadyMember = await organizationRepository.isMember(organizationId, userId);
  if (alreadyMember) throw new ConflictError("Already a member of this organization");
  return prisma.membership.create({ data: { organizationId, userId, role: "member" } });
}

// ============================================================================
// Community role hierarchy — Discord-like rank enforcement, server-side.
// Ranks derive from the existing MembershipRole enum: founder/pi=100
// (President/owner) > leader=90 (Vice President) > advisor=80 > member=10.
// A user cannot remove/edit someone at-or-above their rank, nor assign a
// role at-or-above their own authority. The frontend's role checks are
// never the authorization layer.
// ============================================================================

const ROLE_RANKS: Record<string, number> = {
  founder: 100,
  pi: 100,
  leader: 90,
  advisor: 80,
  member: 10,
};

const ASSIGNABLE_ROLES = ["member", "advisor", "leader"];

export async function assignRole(
  actorId: string,
  organizationId: string,
  targetUserId: string,
  input: { role: string; roleTitle?: string },
) {
  if (actorId === targetUserId) {
    throw new BadRequestError("Use the ownership transfer flow to change your own role");
  }
  const actor = await organizationRepository.getMember(organizationId, actorId);
  if (!actor) throw new ForbiddenError("You are not a member of this community");
  const actorRank = ROLE_RANKS[actor.role] ?? 10;
  if (actorRank < 80) {
    throw new ForbiddenError("Only the President, Vice President, or Heads can assign roles");
  }

  const target = await organizationRepository.getMember(organizationId, targetUserId);
  if (!target) throw new NotFoundError("That user is not a member of this community");
  const targetRank = ROLE_RANKS[target.role] ?? 10;
  if (targetRank >= actorRank) {
    throw new ForbiddenError("You cannot change the role of someone at or above your own rank");
  }

  const newRank = ROLE_RANKS[input.role] ?? 10;
  if (newRank >= actorRank) {
    throw new ForbiddenError("You cannot assign a role at or above your own authority");
  }

  return organizationRepository.updateMember(organizationId, targetUserId, {
    role: input.role,
    roleTitle: input.roleTitle ?? "",
  });
}

export async function removeMember(
  actorId: string,
  organizationId: string,
  targetUserId: string,
) {
  if (actorId === targetUserId) {
    throw new BadRequestError("Use leave to remove your own membership");
  }
  const actor = await organizationRepository.getMember(organizationId, actorId);
  if (!actor) throw new ForbiddenError("You are not a member of this community");
  const actorRank = ROLE_RANKS[actor.role] ?? 10;
  if (actorRank < 80) {
    throw new ForbiddenError("Only the President, Vice President, or Heads can remove members");
  }

  const target = await organizationRepository.getMember(organizationId, targetUserId);
  if (!target) throw new NotFoundError("That user is not a member of this community");
  const targetRank = ROLE_RANKS[target.role] ?? 10;
  if (targetRank >= actorRank) {
    throw new ForbiddenError("You cannot remove someone at or above your own rank");
  }

  await organizationRepository.removeMember(organizationId, targetUserId);
  return { removed: true };
}

/** President transfers presidency/ownership — the target becomes the founder
 * (highest authority) and the previous president steps down to Vice
 * President. The president cannot leave while they remain owner. */
export async function transferOwnership(
  actorId: string,
  organizationId: string,
  targetUserId: string,
) {
  if (actorId === targetUserId) {
    throw new BadRequestError("You already own this community");
  }
  const actor = await organizationRepository.getMember(organizationId, actorId);
  if (!actor) throw new ForbiddenError("You are not a member of this community");
  const actorRank = ROLE_RANKS[actor.role] ?? 10;
  if (actorRank < 100) {
    throw new ForbiddenError("Only the President can transfer ownership");
  }

  const target = await organizationRepository.getMember(organizationId, targetUserId);
  if (!target) throw new NotFoundError("That user is not a member of this community");

  await organizationRepository.transferOwnership(organizationId, actorId, targetUserId);
  return { transferred: true };
}

export async function leave(userId: string, organizationId: string) {
  const membership = await organizationRepository.getMember(organizationId, userId);
  if (!membership) throw new NotFoundError("Membership not found");
  const rank = ROLE_RANKS[membership.role] ?? 10;
  if (rank >= 100) {
    throw new ForbiddenError(
      "The President cannot leave while they own the community — transfer presidency first",
    );
  }
  await organizationRepository.removeMember(organizationId, userId);
  return { left: true };
}
