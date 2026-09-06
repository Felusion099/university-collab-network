import { projectRepository } from "../repositories/project.repository.js";
import { prisma } from "../repositories/prisma.js";
import { matchingService } from "./matching.service.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateProjectRequest, UpdateProjectRequest } from "@app/shared-types";

export async function list(params: {
  cursor?: string;
  limit: number;
  status?: string;
  skill?: string;
  topic?: string;
  lookingFor?: string;
}) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await projectRepository.list({ ...params, skip, take });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const project = await projectRepository.findById(id);
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function create(userId: string, input: CreateProjectRequest) {
  return projectRepository.create(
    {
      name: input.name,
      logoUrl: input.logoUrl,
      problemStatement: input.problemStatement,
      solutionDescription: input.solutionDescription,
      description: input.description,
      status: input.status,
      githubUrl: input.githubUrl,
      demoUrl: input.demoUrl,
      docsUrl: input.docsUrl,
      creator: { connect: { id: userId } },
      members: { create: { userId, roleOnProject: "Creator" } },
    },
    input.topicIds ?? [],
    input.skillsNeeded ?? [],
  );
}

export async function update(userId: string, id: string, input: UpdateProjectRequest) {
  const existing = await projectRepository.findById(id);
  if (!existing) throw new NotFoundError("Project not found");
  const isOwner = await projectRepository.isOwner(id, userId);
  if (!isOwner) throw new ForbiddenError("Only the project creator can edit this project");
  return projectRepository.update(id, {
    name: input.name,
    logoUrl: input.logoUrl,
    problemStatement: input.problemStatement,
    solutionDescription: input.solutionDescription,
    description: input.description,
    status: input.status,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    docsUrl: input.docsUrl,
  });
}

/** Hard delete is not used for projects — see DECISIONS.md D-013 ("soft-delete where applicable"): archiving via status is the applicable case here. */
export async function remove(userId: string, id: string) {
  const existing = await projectRepository.findById(id);
  if (!existing) throw new NotFoundError("Project not found");
  const isOwner = await projectRepository.isOwner(id, userId);
  if (!isOwner) throw new ForbiddenError("Only the project creator can archive this project");
  await projectRepository.archive(id);
}

export async function join(userId: string, projectId: string, roleOnProject?: string) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new NotFoundError("Project not found");
  const alreadyMember = await projectRepository.isOwnerOrMember(projectId, userId);
  if (alreadyMember) throw new ConflictError("Already a member of this project");
  return prisma.projectMember.create({ data: { projectId, userId, roleOnProject } });
}

export async function leave(userId: string, projectId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new NotFoundError("Membership not found");
  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
}

/**
 * Explainable candidate matching per API_CONTRACT.md §5 / ARCHITECTURE.md §6
 * — scores active users against the project's declared skill/topic needs
 * using matching.service.ts (Phase 3, unmodified). MVP candidate pool is
 * capped at 200 users (see project.repository.ts) rather than scored
 * server-wide; acceptable for the project's expected scale per PROJECT_SPEC.md,
 * flagged here for whichever later phase adds real search-index-backed
 * candidate retrieval.
 */
export async function findMatches(requesterId: string, projectId: string, limit: number) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new NotFoundError("Project not found");
  // API_CONTRACT.md §5: "project owner/member only" — not owner-only.
  const canView = await projectRepository.isOwnerOrMember(projectId, requesterId);
  if (!canView)
    throw new ForbiddenError("Only the project creator or a member can view match candidates");

  const excludeIds = project.members.map((m) => m.userId);
  const candidates = await projectRepository.findMatchCandidates(projectId, excludeIds);

  const requirements = {
    skillsNeeded: project.skillsNeeded.map((s) => s.skill.name),
    researchTopics: project.topics.map((t) => t.researchTopic.name),
  };

  const scored = candidates.map((c) => {
    const isConnected = [...c.connectionsSent, ...c.connectionsReceived].some(
      (conn) => conn.requesterId === requesterId || conn.addresseeId === requesterId,
    );
    return matchingService.computeMatch(
      {
        userId: c.id,
        skills: c.userSkills.map((s) => s.skill.name),
        researchTopics: c.userResearchTopics.map((t) => t.researchTopic.name),
        department:
          c.studentProfile?.department ??
          c.professorProfile?.department ??
          c.researcherProfile?.department ??
          undefined,
        availability: c.researcherProfile?.currentAvailability ?? true,
        isConnected,
      },
      requirements,
    );
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
