import type { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/user.repository.js";
import { authRepository } from "../repositories/auth.repository.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type { VerificationRoleClaim } from "@prisma/client";

/**
 * Middleware that verifies the authenticated user is an eligible professor:
 * - requested_role = "professor"
 * - status = "active"
 * - is_university_verified = true
 * - university_domain = recognized university domain
 * - Professor profile exists
 * - Verification exists with role_claimed = "professor" and status = "approved"
 */
/**
 * Middleware that verifies the authenticated user is an eligible professor:
 * - requested_role = "professor"
 * - status = "active"
 * - is_university_verified = true
 * - university_domain = recognized university domain
 * - Professor profile exists
 * - Verification exists with role_claimed = "professor" and status = "approved"
 * 
 * Can be used as Express middleware (calls next()) or as a utility function (returns Promise<void>)
 */
export async function requireProfessorVerified(
  req: Request,
  _res?: Response,
  next?: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new Error("Authentication required - requireAuth must run first");
    }

    const userId = req.user.id;

    // Fetch full user with professor profile and verification status
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check basic eligibility
    if (user.requestedRole !== "professor") {
      throw new ForbiddenError("Only verified professors can perform this action");
    }

    if (user.status !== "active") {
      throw new ForbiddenError("Account must be active to perform this action");
    }

    if (!user.isUniversityVerified) {
      throw new ForbiddenError("University verification required");
    }

    if (!user.universityDomain) {
      throw new ForbiddenError("University domain not set");
    }

    // Check professor profile exists
    const professorProfile = await userRepository.findProfessorProfile(user.id);
    if (!professorProfile) {
      throw new ForbiddenError("Professor profile not found");
    }

    // Check verified professor role
    const approved = await authRepository.findApprovedVerification(
      user.id,
      "professor" as VerificationRoleClaim,
    );

    if (!approved) {
      throw new ForbiddenError("Professor role not yet verified by an administrator");
    }

    // Attach professor info to request for downstream use
    Object.assign(req, {
      professor: {
        userId: user.id,
        professorProfile: {
          fullName: professorProfile.fullName,
          department: professorProfile.department,
          designation: professorProfile.designation,
          expertise: professorProfile.expertise,
          bio: professorProfile.bio,
          officeContact: professorProfile.officeContact,
          mentorshipAvailable: professorProfile.mentorshipAvailable,
        },
      },
    });

    if (next) {
      next();
    }
  } catch (err: unknown) {
    if (next) {
      next(err);
    } else {
      throw err;
    }
  }
}

/**
 * Utility function to verify professor eligibility inline (for use in controllers)
 * Throws if the user is not a verified professor
 */
export async function verifyProfessor(req: Request): Promise<void> {
  await requireProfessorVerified(req, undefined, undefined);
}