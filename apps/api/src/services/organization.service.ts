import { organizationRepository } from "../repositories/organization.repository.js";
import { prisma } from "../repositories/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
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

export async function leave(userId: string, organizationId: string) {
  const membership = await prisma.membership.findFirst({ where: { organizationId, userId } });
  if (!membership) throw new NotFoundError("Membership not found");
  await prisma.membership.delete({ where: { id: membership.id } });
}
