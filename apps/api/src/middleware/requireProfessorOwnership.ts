import type { Request, Response, NextFunction } from "express";
import { requireProfessorVerified } from "./requireProfessorVerified.js";
import { requireResearchOwnership } from "./requireResearchOwnership.js";

export { requireProfessorVerified } from "./requireProfessorVerified.js";

/**
 * Combined middleware that ensures:
 * 1. User is a verified professor (requireProfessorVerified)
 * 2. User owns/leads the research entity (requireResearchOwnership)
 *
 * Usage: requireProfessorOwnership('researchTeam', 'id')
 */
export function requireProfessorOwnership(
  entityType: "researchTeam" | "project" | "researchTopic" | "publication",
  paramName = "id",
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First verify professor eligibility, then check ownership
      await requireProfessorVerified(req, res);
      await requireResearchOwnership({
        entityType,
        paramName,
        allowAdmin: true,
        allowCoOwners: true,
      })(req, res, next);
    } catch (err: unknown) {
      next(err);
    }
  };
}

/**
 * Middleware for professor-only actions that don't require specific entity ownership
 * (e.g., creating new research topics, creating new research teams)
 */
export function requireProfessorOnly(req: Request, res: Response, next: NextFunction): void {
  requireProfessorVerified(req, res, next);
}

/**
 * Middleware for professor actions on their own research topics
 * (create, update, delete own topics)
 */
export function requireProfessorTopicOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  return requireProfessorOwnership("researchTopic", "id")(req, res, next);
}

/**
 * Middleware for professor actions on their own research teams
 */
export function requireProfessorTeamOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  return requireProfessorOwnership("researchTeam", "id")(req, res, next);
}

/**
 * Middleware for professor actions on their own projects
 */
export function requireProfessorProjectOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  return requireProfessorOwnership("project", "id")(req, res, next);
}

/**
 * Middleware for professor actions on their own publications
 */
export function requireProfessorPublicationOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  return requireProfessorOwnership("publication", "id")(req, res, next);
}
