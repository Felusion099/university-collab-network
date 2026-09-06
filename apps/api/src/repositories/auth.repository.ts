import { prisma } from "./prisma.js";
import type { Prisma, VerificationRoleClaim } from "@prisma/client";

export class AuthRepository {
  async createRefreshToken(data: Prisma.RefreshTokenCreateInput) {
    return prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        // select, not the default `true` — this result is used internally
        // (auth.service.ts#refreshTokens reads only .status/.id/.requestedRole
        // off `existing.user`, and the caller never serializes it directly),
        // but scoped per DECISIONS.md D-019's rule regardless: never fetch
        // passwordHash unless a field actually needs it.
        user: {
          select: { id: true, status: true, requestedRole: true },
        },
      },
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Used by requireRole (DECISIONS.md D-003) to check whether a user's
   * self-declared role has been admin-approved. `roleClaimed` must be one
   * of the privileged roles in the VerificationRoleClaim enum — never
   * called for the auto-granted roles (student, alumni). Added Phase 4.
   */
  async findApprovedVerification(userId: string, roleClaimed: VerificationRoleClaim) {
    return prisma.verification.findFirst({
      where: {
        userId,
        roleClaimed,
        status: "approved",
      },
    });
  }
}

export const authRepository = new AuthRepository();
