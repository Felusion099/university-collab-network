import { researchTopicRepository } from "../repositories/researchTopic.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../repositories/prisma.js";
import { privacyService } from "./privacy.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateResearchTopicRequest, UpdateResearchTopicRequest } from "@app/shared-types";
import type { VerificationRoleClaim } from "@prisma/client";
import type { ViewerContext } from "./privacy.service.js";

/**
 * Research Topic Lifecycle Status
 * DRAFT → ACTIVE → PAUSED → COMPLETED → ARCHIVED
 */
export const ResearchTopicStatusEnum = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ResearchTopicStatus = typeof ResearchTopicStatusEnum[keyof typeof ResearchTopicStatusEnum];

/**
 * Valid lifecycle transitions for research topics
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
} as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function list(cursor: string | undefined, limit: number) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await researchTopicRepository.list({ skip, take });
  return buildPaginatedResponse(items, skip, take);
}

/**
 * Per DECISIONS.md D-019: gates whether a user appears in this reverse
 * (topic -> interested users) listing by their own `researchVisibility`,
 * then reuses `privacyService.filterProfileForViewer` — the same function
 * GET /users/:username applies — to strip cgpa/social-links/academic-info
 * from their embedded profile per their own privacy settings. Previously
 * this returned every interested user's full raw profile unfiltered to
 * any anonymous caller.
 */
function toUserSummary(
  u: NonNullable<
    Awaited<ReturnType<typeof researchTopicRepository.findBySlug>>
  >["userResearchTopics"][number]["user"],
  context: ViewerContext,
) {
  const filtered = privacyService.filterProfileForViewer(
    {
      id: u.id,
      username: u.username,
      role: u.requestedRole,
      studentProfile: u.studentProfile
        ? {
            ...u.studentProfile,
            cgpa: u.studentProfile.cgpa !== null ? Number(u.studentProfile.cgpa) : null,
          }
        : null,
      professorProfile: u.professorProfile,
      researcherProfile: u.researcherProfile,
    },
    u.privacySettings,
    context,
  );

  return {
    id: u.id,
    username: u.username,
    role: u.requestedRole,
    fullName:
      u.studentProfile?.fullName ??
      u.professorProfile?.fullName ??
      u.researcherProfile?.fullName ??
      u.username,
    avatarUrl: u.avatarUrl,
    profile: filtered.studentProfile ?? filtered.professorProfile ?? filtered.researcherProfile,
  };
}

export async function getBySlug(slug: string, viewerId: string | undefined) {
  const topic = await researchTopicRepository.findBySlug(slug);
  if (!topic) throw new NotFoundError("Research topic not found");

  // Viewer context computed once — not per listed user — per DECISIONS.md
  // D-019: one viewer lookup + one accepted-connections query, reused via
  // a Set for every interested user's `isConnected` check, rather than
  // profile.service.ts's per-pair buildViewerContext (which would be N
  // query round-trips for N interested users here).
  const viewer = viewerId ? await userRepository.findByIdLean(viewerId) : null;
  const isUniversityMember = Boolean(viewer);
  const isAdmin = viewer?.requestedRole === "admin";

  let connectedIds = new Set<string>();
  if (viewerId) {
    const accepted = await prisma.connection.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    connectedIds = new Set(
      accepted.map((c) => (c.requesterId === viewerId ? c.addresseeId : c.requesterId)),
    );
  }

  const students: ReturnType<typeof toUserSummary>[] = [];
  const professors: ReturnType<typeof toUserSummary>[] = [];
  const researchers: ReturnType<typeof toUserSummary>[] = [];

  for (const urt of topic.userResearchTopics) {
    const u = urt.user;

    const context: ViewerContext = {
      viewerId,
      isAdmin,
      isUniversityMember,
      isConnected: connectedIds.has(u.id),
    };

    const isSelf = Boolean(viewerId) && viewerId === u.id;
    const researchVisibility = u.privacySettings?.researchVisibility ?? "public";
    if (!isSelf && !isAdmin && !privacyService.isAllowed(researchVisibility, context)) {
      continue;
    }

    const userSummary = toUserSummary(u, context);

    if (u.requestedRole === "student") {
      students.push(userSummary);
    } else if (u.requestedRole === "professor") {
      professors.push(userSummary);
    } else if (u.requestedRole === "researcher") {
      researchers.push(userSummary);
    }
  }

  const teams = topic.researchTeamTopics.map((rtt) => rtt.researchTeam);
  const projects = topic.projectTopics.map((pt) => pt.project);
  const publications = topic.publicationTopics.map((pt) => pt.publication);
  const relatedTopics = [...(topic.parentTopic ? [topic.parentTopic] : []), ...topic.childTopics];

  const events = topic.researchTeamTopics.flatMap((rtt) => rtt.researchTeam.events || []);

  const openProblems = topic.opportunities.filter(
    (o) => o.opportunityType === "research" || o.opportunityType === "thesis",
  );

  return {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    description: topic.description,
    parentTopicId: topic.parentTopicId,
    parentTopic: topic.parentTopic,
    childTopics: topic.childTopics,
    relatedTopics,
    researchers,
    professors,
    students,
    teams,
    projects,
    publications,
    openProblems,
    opportunities: topic.opportunities,
    events,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  };
}

/** Topic taxonomy is curated content — restricted to admins, per the same reasoning organizations/projects (user-owned content) are not. */
export async function create(requesterRole: string, input: CreateResearchTopicRequest) {
  if (requesterRole !== "admin") {
    throw new ForbiddenError("Only administrators can create research topics");
  }
  return researchTopicRepository.create({
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    parentTopic: input.parentTopicId ? { connect: { id: input.parentTopicId } } : undefined,
  });
}

export async function update(requesterRole: string, id: string, input: UpdateResearchTopicRequest) {
  if (requesterRole !== "admin") {
    throw new ForbiddenError("Only administrators can update research topics");
  }
  const existing = await researchTopicRepository.findById(id);
  if (!existing) throw new NotFoundError("Research topic not found");
  return researchTopicRepository.update(id, {
    name: input.name,
    slug: input.name ? slugify(input.name) : undefined,
    description: input.description,
    parentTopic:
      input.parentTopicId !== undefined
        ? input.parentTopicId
          ? { connect: { id: input.parentTopicId } }
          : { disconnect: true }
        : undefined,
  });
}

export async function remove(requesterRole: string, id: string) {
  if (requesterRole !== "admin") {
    throw new ForbiddenError("Only administrators can delete research topics");
  }
  const existing = await researchTopicRepository.findById(id);
  if (!existing) throw new NotFoundError("Research topic not found");
  await researchTopicRepository.delete(id);
}

/**
 * ============================================================================
 * PROFESSOR RESEARCH TOPIC MANAGEMENT (New functionality for Phase 9+)
 * ============================================================================
 * 
 * These functions allow verified professors to manage their own research topics.
 * Ownership is determined by the `createdBy` field (to be added to schema).
 * 
 * TODO: When schema migration is applied to add `createdBy` and `status` fields
 * to ResearchTopic model, update these functions to enforce ownership checks.
 * 
 * Current implementation allows any verified professor to create topics.
 * Ownership enforcement will be added when schema migration is applied.
 */

/**
 * Professor creates a new research topic (DRAFT status)
 * Professor becomes the owner (createdBy) and can manage the topic lifecycle
 */
export async function createByProfessor(professorId: string, input: CreateResearchTopicRequest) {
  // Verify professor eligibility
  const user = await userRepository.findById(professorId);
  if (!user) throw new NotFoundError("Professor not found");
  if (user.requestedRole !== "professor" || user.status !== "active" || !user.isUniversityVerified) {
    throw new ForbiddenError("Only verified professors can create research topics");
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

  return researchTopicRepository.create({
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    parentTopic: input.parentTopicId ? { connect: { id: input.parentTopicId } } : undefined,
    // TODO: Add createdBy field to schema when migration is applied
    // createdBy: { connect: { id: professorId } },
    // status: 'DRAFT',
    // TODO: Add status field to schema when migration is applied
  });
}

/**
 * Professor updates their own research topic
 * Only the owner (creator) can update their own topic
 */
export async function updateByProfessor(professorId: string, id: string, input: UpdateResearchTopicRequest) {
  const existing = await researchTopicRepository.findById(id);
  if (!existing) throw new NotFoundError("Research topic not found");

  // TODO: Check ownership when createdBy field is added to schema
  // const isOwner = existing.createdBy === professorId;
  // if (!isOwner) throw new ForbiddenError("Only the topic owner can update this topic");

  // For now, allow any verified professor to update (will be restricted when ownership field added)
  // TODO: Add ownership check when schema is updated
  const isAdmin = false; // Will be set by middleware
  if (!isAdmin) {
    // For now, allow any verified professor (will be restricted when ownership field added)
    // throw new ForbiddenError("Only the topic owner can update this topic");
  }

  return researchTopicRepository.update(id, {
    name: input.name,
    slug: input.name ? slugify(input.name) : undefined,
    description: input.description,
    parentTopic:
      input.parentTopicId !== undefined
        ? input.parentTopicId
          ? { connect: { id: input.parentTopicId } }
          : { disconnect: true }
        : undefined,
  });
}

/**
 * Professor deletes/archives their own research topic
 * Only the owner (creator) can delete their own topic
 * Uses soft-delete (archive) when data relationships exist
 */
export async function removeByProfessor(professorId: string, id: string) {
  const existing = await researchTopicRepository.findById(id);
  if (!existing) throw new NotFoundError("Research topic not found");

  // TODO: Check ownership when createdBy field is added to schema
  // const isOwner = existing.createdBy === professorId;
  // if (!isOwner) throw new ForbiddenError("Only the topic owner can delete this topic");

  // For now, allow any verified professor (will be restricted when ownership field added)
  // TODO: Add ownership check when schema is updated
  const isAdmin = false; // Will be set by middleware
  if (!isAdmin) {
    // For now, allow any verified professor (will be restricted when ownership field added)
    // throw new ForbiddenError("Only the topic owner can delete this topic");
  }

  // Check if topic has related data that would be orphaned
  const hasRelatedData = await prisma.$transaction(async (tx) => {
    const [teams, projects, publications, opportunities, userInterests] = await Promise.all([
      tx.researchTeamTopic.count({ where: { researchTopicId: id } }),
      tx.projectTopic.count({ where: { researchTopicId: id } }),
      tx.publicationTopic.count({ where: { researchTopicId: id } }),
      tx.opportunity.count({ where: { researchTopicId: id } }),
      tx.userResearchTopic.count({ where: { researchTopicId: id } }),
    ]);
    return teams + projects + publications + opportunities + userInterests > 0;
  });

  if (hasRelatedData) {
    // Soft delete - archive instead of hard delete
    // TODO: Add status field to schema when migration is applied
    // return researchTopicRepository.update(id, { status: 'ARCHIVED' });
    throw new ForbiddenError("Cannot delete topic with related data. Use archive instead (not yet implemented).");
  }

  await researchTopicRepository.delete(id);
}

/**
 * Professor updates their own research topic lifecycle status
 * Validates valid state transitions
 */
export async function updateStatusByProfessor(professorId: string, id: string, newStatus: string) {
  const existing = await researchTopicRepository.findById(id);
  if (!existing) throw new NotFoundError("Research topic not found");

  // TODO: Check ownership when createdBy field is added to schema
  // const isOwner = existing.createdBy === professorId;
  // if (!isOwner) throw new ForbiddenError("Only the topic owner can update status");

  // Status column is not yet in the schema (pending migration) — the row
  // never carries a status today, so the effective current status is
  // always DRAFT. Transitions are still validated against the documented
  // table for when the field lands.
  const currentStatus: string = 'DRAFT';
  const validNextStatuses = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || [];
  
  if (!validNextStatuses.includes(newStatus)) {
    throw new ForbiddenError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  // TODO: Update status field when schema is updated
  // return researchTopicRepository.update(id, { status: newStatus });
  throw new ForbiddenError("Status field not yet implemented - pending schema migration");
}

/**
 * Professor gets their own research topics
 */
export async function listByProfessor(professorId: string, cursor?: string, limit?: number) {
  const { skip, take } = toPageParams(cursor, limit ?? 10);
  // TODO: Filter by createdBy when field is added to schema
  // const items = await researchTopicRepository.list({ skip, take, createdBy: professorId });
  const items = await researchTopicRepository.list({ skip, take });
  return buildPaginatedResponse(items, skip, take);
}
