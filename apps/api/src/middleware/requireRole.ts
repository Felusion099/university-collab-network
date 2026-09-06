import type { Request, Response, NextFunction } from "express";
import { authRepository } from "../repositories/auth.repository.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import type { UserRole } from "@app/shared-types";
import type { VerificationRoleClaim } from "@prisma/client";

/**
 * Roles that are auto-granted at signup and never require an admin-reviewed
 * `verifications` row. This is the schema-derived set, not the prose in
 * DECISIONS.md D-003 (which lists `alumni` among roles needing review) —
 * DATABASE_SCHEMA.md's actual `verifications.role_claimed` definition
 * ("same set as requested_role minus student/alumni"), which is what the
 * Prisma `VerificationRoleClaim` enum implements, is the authoritative
 * source. See DECISIONS.md D-011 for this clarification.
 */
const AUTO_GRANTED_ROLES = new Set<UserRole>(["student", "alumni"]);

/**
 * requireRole([...]) — must run after requireAuth. Enforces DECISIONS.md
 * D-003: privileged roles are only authorized once
 * `verifications.status = 'approved'` for that specific role claim.
 * `users.requested_role` alone is never sufficient for a privileged role.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const userRole = req.user.requestedRole;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError("You do not have access to this resource");
      }

      if (AUTO_GRANTED_ROLES.has(userRole)) {
        next();
        return;
      }

      const approved = await authRepository.findApprovedVerification(
        req.user.id,
        userRole as VerificationRoleClaim,
      );

      if (!approved) {
        throw new ForbiddenError("This role has not been verified by an administrator yet");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
