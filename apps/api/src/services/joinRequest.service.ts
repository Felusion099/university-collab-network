import { prisma } from "../repositories/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { JoinRequestDirection } from "@prisma/client";

/**
 * JoinRequest — ONE coherent mechanism for BOTH membership requests
 * (user → creator) AND invitations (creator → user), for BOTH projects
 * and research teams (polymorphic projectId/researchTeamId). No separate
 * request + invitation tables, no separate project/research systems.
 *
 * Events create real state (spec §55): submitting notifies the creator;
 * accepting CREATES the actual ProjectMember/Membership record; both
 * sides are notified; counts remain derived from real membership rows.
 */

const PROJECT_NOTIF_ACCEPTED = "team_recruitment";
const PROJECT_NOTIF_REQUEST = "team_recruitment";
const PROJECT_NOTIF_REJECTED = "profile_interaction";

async function assertProjectAuthority(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError("Project not found");
  if (project.createdBy !== userId) {
    throw new ForbiddenError("Only the project creator can manage join requests");
  }
  return project;
}

async function assertTeamAuthority(researchTeamId: string, userId: string) {
  const team = await prisma.researchTeam.findUnique({ where: { id: researchTeamId } });
  if (!team) throw new NotFoundError("Research team not found");
  if (team.piUserId !== userId && team.createdBy !== userId) {
    throw new ForbiddenError("Only the PI or creator can manage join requests");
  }
  return team;
}

async function notify(userId: string, type: string, payload: object) {
  // Non-blocking side effect (same pattern as connection.service.ts)
  try {
    await notificationRepository.create(userId, type, payload);
  } catch {
    // notification failure never blocks the primary action
  }
}

/** User requests to join a project → pending request + creator notification. */
export async function requestToJoinProject(userId: string, projectId: string, message?: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError("Project not found");
  if (project.createdBy === userId) {
    throw new ConflictError("You already lead this project");
  }
  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (alreadyMember) throw new ConflictError("Already a member of this project");

  const duplicate = await prisma.joinRequest.findFirst({
    where: { projectId, userId, direction: "request", status: "pending" },
  });
  if (duplicate) throw new ConflictError("You already have a pending request for this project");

  const request = await prisma.joinRequest.create({
    data: { projectId, userId, direction: "request", message: message ?? null },
    include: { project: { select: { name: true } } },
  });

  await notify(project.createdBy, PROJECT_NOTIF_REQUEST, {
    kind: "project_join_request",
    requestId: request.id,
    projectId,
    projectName: project.name,
    requesterId: userId,
  });

  return request;
}

/** Creator invites a user to their project → pending invitation + notification. */
export async function inviteToProject(creatorId: string, projectId: string, inviteeId: string) {
  await assertProjectAuthority(projectId, creatorId);
  const invitee = await userRepository.findByIdLean(inviteeId);
  if (!invitee) throw new NotFoundError("User not found");
  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: inviteeId } },
  });
  if (alreadyMember) throw new ConflictError("Already a member of this project");
  const duplicate = await prisma.joinRequest.findFirst({
    where: { projectId, userId: inviteeId, direction: "invitation", status: "pending" },
  });
  if (duplicate) throw new ConflictError("Already invited");

  const request = await prisma.joinRequest.create({
    data: { projectId, userId: inviteeId, direction: "invitation" },
    include: { project: { select: { name: true } } },
  });

  await notify(inviteeId, "project_invitation", {
    kind: "project_invitation",
    requestId: request.id,
    projectId,
    projectName: request.project?.name ?? "",
  });

  return request;
}

/** Accept: creates the REAL membership record (ProjectMember). */
export async function acceptProjectJoinRequest(authorityId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.projectId) throw new NotFoundError("Request not found");
  await assertProjectAuthority(request.projectId, authorityId);
  if (request.status !== "pending") throw new ConflictError("Request already handled");

  await prisma.$transaction([
    prisma.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } }),
    prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: request.projectId, userId: request.userId },
      },
      create: { projectId: request.projectId, userId: request.userId },
      update: {},
    }),
  ]);

  await notify(request.userId, PROJECT_NOTIF_ACCEPTED, {
    kind: request.direction === "invitation" ? "project_invitation_accepted" : "project_request_accepted",
    projectId: request.projectId,
  });

  return { accepted: true, projectId: request.projectId, userId: request.userId };
}

/** Reject: membership is NOT created. */
export async function rejectProjectJoinRequest(authorityId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.projectId) throw new NotFoundError("Request not found");
  await assertProjectAuthority(request.projectId, authorityId);
  if (request.status !== "pending") throw new ConflictError("Request already handled");

  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });

  await notify(request.userId, PROJECT_NOTIF_REJECTED, {
    kind: request.direction === "invitation" ? "project_invitation_rejected" : "project_request_rejected",
    projectId: request.projectId,
  });

  return { rejected: true };
}

/* ================= research teams (same mechanism) ================= */

export async function requestToJoinTeam(userId: string, researchTeamId: string, message?: string) {
  const team = await prisma.researchTeam.findUnique({ where: { id: researchTeamId } });
  if (!team) throw new NotFoundError("Research team not found");
  if (team.piUserId === userId || team.createdBy === userId) {
    throw new ConflictError("You already lead this team");
  }
  const alreadyMember = await prisma.membership.findFirst({
    where: { researchTeamId, userId },
  });
  if (alreadyMember) throw new ConflictError("Already a member of this team");
  const duplicate = await prisma.joinRequest.findFirst({
    where: { researchTeamId, userId, direction: "request", status: "pending" },
  });
  if (duplicate) throw new ConflictError("You already have a pending request for this team");

  const request = await prisma.joinRequest.create({
    data: { researchTeamId, userId, direction: "request", message: message ?? null },
    include: { researchTeam: { select: { name: true } } },
  });

  await notify(team.piUserId, PROJECT_NOTIF_REQUEST, {
    kind: "team_join_request",
    requestId: request.id,
    researchTeamId,
    teamName: team.name,
    requesterId: userId,
  });

  return request;
}

export async function acceptTeamJoinRequest(authorityId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.researchTeamId) throw new NotFoundError("Request not found");
  await assertTeamAuthority(request.researchTeamId, authorityId);
  if (request.status !== "pending") throw new ConflictError("Request already handled");

  // Membership has no composite unique constraint — look up first, then
  // update-or-create (same pattern as researchTeam PI transfer).
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: request.userId, researchTeamId: request.researchTeamId },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: { userId: request.userId, researchTeamId: request.researchTeamId, role: "member" },
    });
  }
  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } });

  await notify(request.userId, PROJECT_NOTIF_ACCEPTED, {
    kind: "team_request_accepted",
    researchTeamId: request.researchTeamId,
  });

  return { accepted: true, researchTeamId: request.researchTeamId, userId: request.userId };
}

export async function rejectTeamJoinRequest(authorityId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.researchTeamId) throw new NotFoundError("Request not found");
  await assertTeamAuthority(request.researchTeamId, authorityId);
  if (request.status !== "pending") throw new ConflictError("Request already handled");

  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });

  await notify(request.userId, PROJECT_NOTIF_REJECTED, {
    kind: "team_request_rejected",
    researchTeamId: request.researchTeamId,
  });

  return { rejected: true };
}

/* ================= listing ================= */

/** Creator/PI view: pending requests for their project (or team). */
export async function listForProject(
  authorityId: string,
  projectId: string,
  cursor: string | undefined,
  limit: number,
) {
  await assertProjectAuthority(projectId, authorityId);
  const { skip, take } = toPageParams(cursor, limit);
  const items = await prisma.joinRequest.findMany({
    where: { projectId, status: "pending" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: take + 1,
  });
  return buildPaginatedResponse(items, skip, take);
}

export async function listForTeam(
  authorityId: string,
  researchTeamId: string,
  cursor: string | undefined,
  limit: number,
) {
  await assertTeamAuthority(researchTeamId, authorityId);
  const { skip, take } = toPageParams(cursor, limit);
  const items = await prisma.joinRequest.findMany({
    where: { researchTeamId, status: "pending" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, requestedRole: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: take + 1,
  });
  return buildPaginatedResponse(items, skip, take);
}

/** Caller's own requests/invitations (pending) — My Projects "Pending" section. */
export async function listMine(userId: string, direction?: JoinRequestDirection) {
  const items = await prisma.joinRequest.findMany({
    where: { userId, status: "pending", ...(direction ? { direction } : {}) },
    include: {
      project: { select: { id: true, name: true, status: true } },
      researchTeam: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { data: items };
}

/** Caller accepts an INVITATION addressed to them → real membership. */
export async function acceptInvitation(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Invitation not found");
  if (request.userId !== userId) throw new ForbiddenError("This invitation is not yours");
  if (request.direction !== "invitation") throw new ForbiddenError("Not an invitation");
  if (request.status !== "pending") throw new ConflictError("Invitation already handled");

  if (request.projectId) {
    await prisma.$transaction([
      prisma.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } }),
      prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: request.projectId, userId } },
        create: { projectId: request.projectId, userId },
        update: {},
      }),
    ]);
    const project = await prisma.project.findUnique({
      where: { id: request.projectId },
      select: { createdBy: true, name: true },
    });
    if (project) {
      await notify(project.createdBy, PROJECT_NOTIF_ACCEPTED, {
        kind: "project_invitation_accepted",
        projectId: request.projectId,
        userId,
      });
    }
    return { accepted: true, projectId: request.projectId };
  }

  if (request.researchTeamId) {
    const existingMembership = await prisma.membership.findFirst({
      where: { userId, researchTeamId: request.researchTeamId },
    });
    if (!existingMembership) {
      await prisma.membership.create({
        data: { userId, researchTeamId: request.researchTeamId, role: "member" },
      });
    }
    await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "accepted" } });
    const team = await prisma.researchTeam.findUnique({
      where: { id: request.researchTeamId },
      select: { piUserId: true, name: true },
    });
    if (team) {
      await notify(team.piUserId, PROJECT_NOTIF_ACCEPTED, {
        kind: "team_invitation_accepted",
        researchTeamId: request.researchTeamId,
        userId,
      });
    }
    return { accepted: true, researchTeamId: request.researchTeamId };
  }

  throw new NotFoundError("Invitation has no target");
}

export async function declineInvitation(userId: string, requestId: string) {
  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Invitation not found");
  if (request.userId !== userId) throw new ForbiddenError("This invitation is not yours");
  if (request.status !== "pending") throw new ConflictError("Invitation already handled");
  await prisma.joinRequest.update({ where: { id: requestId }, data: { status: "rejected" } });
  return { declined: true };
}
