import { prisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        professorProfile: true,
        researcherProfile: true,
        professionalProfile: true,
        privacySettings: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Added Phase 5 (D-013) for `GET /users/:username` and username-collision
   * checks during signup's server-side username generation.
   */
  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        studentProfile: true,
        professorProfile: true,
        researcherProfile: true,
        professionalProfile: true,
        privacySettings: true,
        // Portfolio composition — real relationships only (no stored
        // portfolio rows); profile.service.ts derives the composed view
        // from these and privacy-filters it per viewer.
        projectMemberships: { include: { project: { select: { id: true, name: true, status: true, createdBy: true } } } },
        memberships: {
          include: {
            organization: { select: { id: true, name: true, type: true } },
            researchTeam: { select: { id: true, name: true } },
          },
        },
        projectsCreated: { select: { id: true, name: true, status: true } },
        researchTeamsLed: { select: { id: true, name: true } },
        researchTeamsCreated: { select: { id: true, name: true } },
        publicationAuthorships: {
          include: { publication: { select: { id: true, title: true, publishedDate: true, journalOrConference: true } } },
        },
        userSkills: { include: { skill: { select: { id: true, name: true } } } },
        userResearchTopics: { include: { researchTopic: { select: { id: true, name: true, slug: true } } } },
        organizationsCreated: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async usernameExists(username: string) {
    const row = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    return Boolean(row);
  }

  /**
   * Lean lookup used by requireAuth on every authenticated request — avoids
   * the profile joins findById() pulls in, which aren't needed just to
   * establish identity/status. Added in Phase 4 (auth middleware).
   */
  async findByIdLean(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        requestedRole: true,
        status: true,
        onboardingCompletedAt: true,
      },
    });
  }

  async findByRole(role?: string, limit = 20, cursor?: string) {
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    const where: Prisma.UserWhereInput = role
      ? { requestedRole: role as Prisma.EnumUserRoleFilter["equals"] }
      : {};
    const users = await prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      // SAFE_USER_SELECT semantics: email is connections_only by default
      // (privacy_settings) and must never appear in a public list — any
      // viewer (even anonymous) could harvest every user's address.
      // Combined-project extension: role profile rows + goals are included
      // so the Campus UI's directory renders from ONE paginated request —
      // no per-user hydration N+1. These fields are university_only by
      // default (visible to authenticated members, matching the per-user
      // profile endpoint's behavior for the same viewers).
      select: {
        id: true,
        username: true,
        requestedRole: true,
        status: true,
        avatarUrl: true,
        isUniversityVerified: true,
        studentProfile: true,
        professorProfile: true,
        researcherProfile: true,
        professionalProfile: true,
        goals: true,
        createdAt: true,
      },
    });
    return { data: users, nextCursor: users.length === limit ? String(offset + limit) : null };
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findProfessorProfile(userId: string) {
    return prisma.professorProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Portfolio-include lookup by id — same relationships findByUsername
   * pulls, used by GET /users/me (the JWT carries no username, so the
   * frontend cannot address itself via /users/:username). Reused by the
   * onboarding prefill and the composed portfolio view.
   */
  async findByIdWithPortfolio(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        professorProfile: true,
        researcherProfile: true,
        professionalProfile: true,
        privacySettings: true,
        projectMemberships: { include: { project: { select: { id: true, name: true, status: true, createdBy: true } } } },
        memberships: {
          include: {
            organization: { select: { id: true, name: true, type: true } },
            researchTeam: { select: { id: true, name: true } },
          },
        },
        projectsCreated: { select: { id: true, name: true, status: true } },
        researchTeamsLed: { select: { id: true, name: true } },
        researchTeamsCreated: { select: { id: true, name: true } },
        publicationAuthorships: {
          include: { publication: { select: { id: true, title: true, publishedDate: true, journalOrConference: true } } },
        },
        userSkills: { include: { skill: { select: { id: true, name: true } } } },
        userResearchTopics: { include: { researchTopic: { select: { id: true, name: true, slug: true } } } },
        organizationsCreated: { select: { id: true, name: true, type: true } },
      },
    });
  }
}

export const userRepository = new UserRepository();
