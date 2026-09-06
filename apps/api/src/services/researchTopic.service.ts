import { researchTopicRepository } from "../repositories/researchTopic.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { prisma } from "../repositories/prisma.js";
import { privacyService } from "./privacy.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateResearchTopicRequest, UpdateResearchTopicRequest } from "@app/shared-types";
import type { ViewerContext } from "./privacy.service.js";

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
