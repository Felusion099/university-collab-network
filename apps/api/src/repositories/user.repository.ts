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
        privacySettings: true,
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
      select: { id: true, username: true, email: true, requestedRole: true, status: true, avatarUrl: true, isUniversityVerified: true },
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
}

export const userRepository = new UserRepository();
