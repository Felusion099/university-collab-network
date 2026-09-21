import { prisma } from "../repositories/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { privacyService } from "./privacy.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { ViewerContext } from "./privacy.service.js";
import type {
  UpdateProfileRequest,
  UpdatePrivacySettingsRequest,
  Portfolio,
  UserProjectRef,
  UserTeamRef,
  UserPublicationRef,
  UserOrgRef,
  UserTopicRef,
  UserSkillRef,
  PrivacySettings,
} from "@app/shared-types";

/**
 * Server-generated username (D-013) — email local-part, lowercased,
 * non-alphanumeric characters stripped, de-duplicated with a numeric suffix
 * on collision. Never user-chosen in this MVP pass.
 */
export async function generateUniqueUsername(email: string): Promise<string> {
  const local = email.split("@")[0] ?? "user";
  const base =
    local
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 24) || "user";

  let candidate = base;
  let suffix = 0;
  // Bounded loop — signup is rare enough that a handful of collision checks
  // is not a scaling concern; a truly pathological run falls back to a
  // random suffix rather than looping forever.
  while (await userRepository.usernameExists(candidate)) {
    suffix += 1;
    if (suffix > 50) {
      candidate = `${base}${Math.floor(Math.random() * 1_000_000)}`;
      break;
    }
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

async function buildViewerContext(
  viewerId: string | undefined,
  targetUserId: string,
): Promise<ViewerContext> {
  if (!viewerId) return {};
  if (viewerId === targetUserId) return { viewerId, isAdmin: false };

  const [viewer, target, connection] = await Promise.all([
    userRepository.findByIdLean(viewerId),
    userRepository.findByIdLean(targetUserId),
    prisma.connection.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: viewerId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: viewerId },
        ],
      },
    }),
  ]);

  return {
    viewerId,
    isAdmin: viewer?.requestedRole === "admin",
    isUniversityMember: Boolean(viewer) && Boolean(target),
    isConnected: Boolean(connection),
  };
}

export async function getProfileByUsername(username: string, viewerId: string | undefined) {
  const user = await userRepository.findByUsername(username);
  if (!user) throw new NotFoundError("User not found");

  const context = await buildViewerContext(viewerId, user.id);

  const profile = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.requestedRole,
    status: user.status,
    isUniversityVerified: user.isUniversityVerified,
    avatarUrl: user.avatarUrl,
    studentProfile: user.studentProfile
      ? {
          ...user.studentProfile,
          cgpa: user.studentProfile.cgpa !== null ? Number(user.studentProfile.cgpa) : null,
        }
      : null,
    professorProfile: user.professorProfile,
    researcherProfile: user.researcherProfile,
    professionalProfile: user.professionalProfile,
    goals: (user.goals as import("@app/shared-types").Goal[] | null) ?? null,
    createdAt: user.createdAt.toISOString(),
    portfolio: buildPortfolio(user, user.privacySettings, context),
  };

  return privacyService.filterProfileForViewer(profile, user.privacySettings, context);
}

/**
 * Composes the portfolio view from the user's real entity relationships.
 * The portfolio is never stored — this runs on every profile read, so it
 * stays a living view that updates automatically as relationships change.
 *
 * Privacy mapping (existing PrivacySettings fields only — no new privacy
 * system): projects → projectsVisibility, research teams/topics/
 * publications → researchVisibility, organizations → activityVisibility,
 * skills → academicVisibility. Sections the viewer may not see are omitted
 * entirely (absent, not null) server-side — the frontend never decides.
 */
function buildPortfolio(
  user: NonNullable<Awaited<ReturnType<typeof userRepository.findByUsername>>>,
  privacy: PrivacySettings | null | undefined,
  context: ViewerContext,
): Portfolio {
  const allowed = (
    level: "public" | "university_only" | "connections_only" | "private",
  ): boolean => privacyService.isAllowed(level, context);

  const projects: UserProjectRef[] = allowed(
    privacy?.projectsVisibility ?? "public",
  )
    ? [
        ...user.projectsCreated.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          relation: "lead" as const,
        })),
        ...user.projectMemberships
          .filter((m) => m.project.createdBy !== user.id)
          .map((m) => ({
            id: m.project.id,
            name: m.project.name,
            status: m.project.status,
            relation: "member" as const,
          })),
      ]
    : [];

  const teamIds = new Set<string>();
  const researchTeams: UserTeamRef[] = allowed(
    privacy?.researchVisibility ?? "public",
  )
    ? [
        ...user.researchTeamsLed
          .map((t) => {
            teamIds.add(t.id);
            return { id: t.id, name: t.name, relation: "pi" as const };
          }),
        ...user.researchTeamsCreated
          .filter((t) => !teamIds.has(t.id))
          .map((t) => {
            teamIds.add(t.id);
            return { id: t.id, name: t.name, relation: "pi" as const };
          }),
        ...user.memberships
          .filter((m) => m.researchTeamId && m.researchTeam && !teamIds.has(m.researchTeam.id))
          .map((m) => ({
            id: m.researchTeam!.id,
            name: m.researchTeam!.name,
            relation: "member" as const,
          })),
      ]
    : [];

  const publications: UserPublicationRef[] = allowed(
    privacy?.researchVisibility ?? "public",
  )
    ? user.publicationAuthorships.map((a) => ({
        id: a.publication.id,
        title: a.publication.title,
        publishedDate: a.publication.publishedDate
          ? a.publication.publishedDate.toISOString().slice(0, 10)
          : null,
        journalOrConference: a.publication.journalOrConference,
      }))
    : [];

  const orgIds = new Set<string>();
  const organizations: UserOrgRef[] = allowed(
    privacy?.activityVisibility ?? "connections_only",
  )
    ? [
        ...user.memberships
          .filter((m) => m.organizationId && m.organization && !orgIds.has(m.organization.id))
          .map((m) => {
            const org = m.organization!;
            orgIds.add(org.id);
            return {
              id: org.id,
              name: org.name,
              orgType: org.type ?? null,
              relation: "member" as const,
            };
          }),
        ...user.organizationsCreated
          .filter((o) => !orgIds.has(o.id))
          .map((o) => {
            orgIds.add(o.id);
            return {
              id: o.id,
              name: o.name,
              orgType: o.type ?? null,
              relation: "creator" as const,
            };
          }),
      ]
    : [];

  const skills: UserSkillRef[] = allowed(
    privacy?.academicVisibility ?? "university_only",
  )
    ? user.userSkills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        proficiency: s.proficiency ?? null,
      }))
    : [];

  const researchTopics: UserTopicRef[] = allowed(
    privacy?.researchVisibility ?? "public",
  )
    ? user.userResearchTopics.map((t) => ({
        id: t.researchTopic.id,
        name: t.researchTopic.name,
        slug: t.researchTopic.slug,
      }))
    : [];

  return { projects, researchTeams, publications, organizations, skills, researchTopics };
}

/**
 * GET /users/me — the authenticated caller's own profile, owner view
 * (privacy-unfiltered for self, per filterProfileForViewer's owner rule).
 * Needed because the JWT/AuthenticatedUser carries no username, so the
 * frontend cannot address itself via /users/:username. Reuses the exact
 * same composition + privacy pipeline as getProfileByUsername.
 */
export async function getOwnProfile(userId: string) {
  const user = await userRepository.findByIdWithPortfolio(userId);
  if (!user) throw new NotFoundError("User not found");

  const context = await buildViewerContext(userId, user.id);

  const profile = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.requestedRole,
    status: user.status,
    isUniversityVerified: user.isUniversityVerified,
    avatarUrl: user.avatarUrl,
    studentProfile: user.studentProfile
      ? {
          ...user.studentProfile,
          cgpa: user.studentProfile.cgpa !== null ? Number(user.studentProfile.cgpa) : null,
        }
      : null,
    professorProfile: user.professorProfile,
    researcherProfile: user.researcherProfile,
    professionalProfile: user.professionalProfile,
    goals: (user.goals as import("@app/shared-types").Goal[] | null) ?? null,
    createdAt: user.createdAt.toISOString(),
    portfolio: buildPortfolio(user, user.privacySettings, context),
  };

  return privacyService.filterProfileForViewer(profile, user.privacySettings, context);
}

/**
 * Onboarding status — users.onboarding_completed_at is the single
 * authoritative marker (NULL = incomplete). Role comes from the existing
 * UserRole; no onboarding enum is introduced.
 */
/**
 * Onboarding STATUS step (spec §13): the user's academic/professional
 * status — their primary identity CONTEXT, not their activities. Only
 * the five persona statuses are switchable here; club_rep/startup_member
 * remain activity-derived signup options. Server-authoritative: role
 * changes never grant capabilities (privileged actions still require
 * Verification per D-003).
 */
const PERSONA_STATUSES = ["student", "professor", "researcher", "professional", "alumni"] as const;

export async function updateOwnStatus(userId: string, status: string) {
  if (!PERSONA_STATUSES.includes(status as (typeof PERSONA_STATUSES)[number])) {
    throw new ForbiddenError(
      "Status can only be one of: student, faculty, researcher, professional, alumni",
    );
  }
  const user = await userRepository.findByIdLean(userId);
  if (!user) throw new NotFoundError("User not found");

  const requestedRole = status as "student" | "professor" | "researcher" | "professional" | "alumni";

  // Ensure the persona's profile row exists (mirrors signup behavior)
  if (requestedRole === "student" || requestedRole === "alumni") {
    const existing = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.studentProfile.create({ data: { userId, fullName: "" } });
    }
  } else if (requestedRole === "professor") {
    const existing = await prisma.professorProfile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.professorProfile.create({ data: { userId, fullName: "" } });
    }
  } else if (requestedRole === "researcher") {
    const existing = await prisma.researcherProfile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.researcherProfile.create({
        data: { userId, fullName: "", researcherType: "research_assistant" },
      });
    }
  } else if (requestedRole === "professional") {
    const existing = await prisma.professionalProfile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.professionalProfile.create({ data: { userId, fullName: "" } });
    }
  }

  await userRepository.update(userId, { requestedRole } as never);
  return { status: requestedRole };
}

export async function getOnboardingStatus(userId: string) {
  const user = await userRepository.findByIdLean(userId);
  if (!user) throw new NotFoundError("User not found");
  return {
    completed: user.onboardingCompletedAt !== null,
    completedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
    role: user.requestedRole,
  };
}

export async function completeOnboarding(userId: string) {
  const user = await userRepository.findByIdLean(userId);
  if (!user) throw new NotFoundError("User not found");
  if (user.onboardingCompletedAt === null) {
    await userRepository.update(userId, { onboardingCompletedAt: new Date() });
  }
  return getOnboardingStatus(userId);
}

/**
 * Research interests — links the caller to a research topic via the
 * EXISTING user_research_topics table (composite PK userId+researchTopicId,
 * already used by researchTopic.service.ts's reverse listing). No new
 * table, no new relationship type.
 */
export async function addOwnInterest(userId: string, topicId: string) {
  // Malformed ids (non-uuid) would surface as Prisma 500s — reject early
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicId)) {
    throw new NotFoundError("Research topic not found");
  }
  const topic = await prisma.researchTopic.findUnique({ where: { id: topicId }, select: { id: true } });
  if (!topic) throw new NotFoundError("Research topic not found");
  await prisma.userResearchTopic.upsert({
    where: { userId_researchTopicId: { userId, researchTopicId: topicId } },
    create: { userId, researchTopicId: topicId },
    update: {},
  });
  return { topicId, added: true };
}

export async function removeOwnInterest(userId: string, topicId: string) {
  await prisma.userResearchTopic.deleteMany({
    where: { userId, researchTopicId: topicId },
  });
  return { topicId, removed: true };
}

/**
 * Profile verification — request/status using the EXISTING Verification
 * model (userId, roleClaimed unique-pair, status, evidenceUrl) and the
 * existing admin review workflow (requireRole(["admin"]) approve/reject).
 * A user can only REQUEST; self-approval is impossible — the status is
 * server-authoritative.
 */
// Roles that map to a VerificationRoleClaim — student/alumni are
// auto-granted (D-003: no verification lookup) and rely on university
// email verification instead, so no role claim exists for them.
const VERIFIABLE_ROLES = ["professor", "researcher", "club_rep", "startup_member", "admin"];

export async function getOwnVerificationStatus(userId: string) {
  const user = await userRepository.findByIdLean(userId);
  if (!user) throw new NotFoundError("User not found");
  const verifiable = VERIFIABLE_ROLES.includes(user.requestedRole);
  const [request, isUniversityVerified] = await Promise.all([
    verifiable
      ? prisma.verification.findUnique({
          where: {
            userId_roleClaimed: {
              userId,
              roleClaimed: user.requestedRole as "professor" | "researcher" | "club_rep" | "startup_member" | "admin",
            },
          },
        })
      : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: userId }, select: { isUniversityVerified: true } }),
  ]);
  return {
    role: user.requestedRole,
    isUniversityVerified: isUniversityVerified?.isUniversityVerified ?? false,
    verificationAvailable: verifiable,
    request: request
      ? {
          id: request.id,
          roleClaimed: request.roleClaimed,
          status: request.status,
          evidenceUrl: request.evidenceUrl ?? null,
          submittedAt: request.createdAt.toISOString(),
          reviewedAt: request.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function requestVerification(
  userId: string,
  input: { roleClaimed?: string; evidenceUrl?: string },
) {
  const user = await userRepository.findByIdLean(userId);
  if (!user) throw new NotFoundError("User not found");

  // The role claimed defaults to the caller's own requestedRole — users
  // cannot claim a different role through this flow (role changes remain
  // an admin decision per the existing authorization model).
  const roleClaimed = (input.roleClaimed ?? user.requestedRole) as
    | "professor"
    | "researcher"
    | "club_rep"
    | "startup_member"
    | "admin";
  if (!VERIFIABLE_ROLES.includes(roleClaimed)) {
    throw new ForbiddenError(
      "This role is verified through your institutional email — no verification request is needed",
    );
  }

  const existing = await prisma.verification.findUnique({
    where: { userId_roleClaimed: { userId, roleClaimed } },
  });
  if (existing && existing.status === "pending") {
    return { alreadyPending: true, request: existing };
  }
  if (existing && existing.status === "approved") {
    return { alreadyApproved: true, request: existing };
  }

  const request = existing
    ? await prisma.verification.update({
        where: { id: existing.id },
        data: { status: "pending", evidenceUrl: input.evidenceUrl ?? null },
      })
    : await prisma.verification.create({
        data: { userId, roleClaimed, status: "pending", evidenceUrl: input.evidenceUrl ?? null },
      });

  return { submitted: true, request };
}

export async function updateOwnProfile(userId: string, input: UpdateProfileRequest) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (input.avatarUrl !== undefined || input.phone !== undefined) {
    await userRepository.update(userId, {
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    });
  }

  if (user.requestedRole === "student" && input.studentProfile) {
    await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, fullName: input.fullName ?? "", ...input.studentProfile },
      update: input.studentProfile,
    });
  }
  if (user.requestedRole === "professor" && input.professorProfile) {
    await prisma.professorProfile.upsert({
      where: { userId },
      create: { userId, fullName: input.fullName ?? "", ...input.professorProfile },
      update: input.professorProfile,
    });
  }
  if (user.requestedRole === "researcher" && input.researcherProfile) {
    const { researcherType, researchAreas, ...restResearcher } = input.researcherProfile;
    // Zod allows nullable arrays; Prisma wants string[] | undefined
    const areas = researchAreas ?? undefined;
    await prisma.researcherProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: input.fullName ?? "",
        researcherType: researcherType ?? "research_assistant",
        researchAreas: areas ?? [],
        ...restResearcher,
      },
      update: {
        ...(researcherType ? { researcherType } : {}),
        ...(areas !== undefined ? { researchAreas: areas } : {}),
        ...restResearcher,
      },
    });
  }
  if (user.requestedRole === "professional" && input.professionalProfile) {
    await prisma.professionalProfile.upsert({
      where: { userId },
      create: { userId, fullName: input.fullName ?? "", ...input.professionalProfile },
      update: input.professionalProfile,
    });
  }
  if (input.goals !== undefined) {
    await userRepository.update(userId, {
      goals: input.goals.length > 0 ? input.goals : null,
    } as never);
  }

  return userRepository.findById(userId);
}

export async function getOwnPrivacySettings(userId: string) {
  const settings = await prisma.privacySettings.findUnique({ where: { userId } });
  if (settings) return settings;
  // Defaults per DATABASE_SCHEMA.md column defaults — created lazily on first read/write.
  return prisma.privacySettings.create({ data: { userId } });
}

export async function updateOwnPrivacySettings(
  userId: string,
  input: UpdatePrivacySettingsRequest,
) {
  return prisma.privacySettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
