import type { Request, Response, NextFunction } from "express";
import { prisma } from "../repositories/prisma.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";

/**
 * Middleware that verifies the authenticated user owns/leads the research entity
 * or is an authorized member with appropriate permissions.
 * 
 * Usage: requireResearchOwnership({ entityType: 'researchTeam', paramName: 'id', requiredRole: 'pi' })
 * 
 * @param options - Configuration object
 * @param options.entityType - Type of entity ('researchTeam' | 'project' | 'researchTopic' | 'publication')
 * @param options.paramName - URL parameter name containing the entity ID (default: 'id')
 * @param options.requiredRoles - Array of allowed roles ('pi' | 'creator' | 'member' | 'admin')
 * @param options.allowAdmin - Whether to allow admins (default: true)
 * @param options.allowCoOwners - Whether to allow co-owners/co-PIs (default: false)
 */
export interface RequireResearchOwnershipOptions {
  entityType: 'researchTeam' | 'project' | 'researchTopic' | 'publication';
  paramName?: string;
  allowAdmin?: boolean;
  allowCoOwners?: boolean;
}

export function requireResearchOwnership(options: RequireResearchOwnershipOptions) {
  const {
    entityType,
    paramName = 'id',
    allowAdmin = true,
    allowCoOwners = false,
  } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error("Authentication required - requireAuth must run first");
      }

      const userId = req.user.id;
      const userRole = req.user.requestedRole;
      const entityId = req.params[paramName];

      if (!entityId) {
        throw new NotFoundError(`${entityType} ID not provided`);
      }

      // Admin bypass check (if allowed)
      if (allowAdmin && userRole === 'admin') {
        return next();
      }

      // Check ownership/authorization based on entity type
      let hasPermission = false;

      if (entityType === 'researchTeam') {
        const team = await prisma.researchTeam.findUnique({
          where: { id: entityId },
          select: { piUserId: true, createdBy: true },
        });
        if (!team) throw new NotFoundError("Research team not found");
        
        // Check if user is PI or creator
        hasPermission = team.piUserId === userId || team.createdBy === userId;
        
        // Check co-owner if allowed
        if (!hasPermission && allowCoOwners) {
          const membership = await prisma.membership.findFirst({
            where: { userId, researchTeamId: entityId },
            select: { role: true },
          });
          hasPermission = membership?.role === 'pi' || membership?.role === 'advisor';
        }
      } else if (entityType === 'project') {
        const project = await prisma.project.findUnique({
          where: { id: entityId },
          select: { createdBy: true },
        });
        if (!project) throw new NotFoundError("Project not found");
        
        // Check if user is creator/owner
        hasPermission = project.createdBy === userId;
        
        // Check co-owner if allowed (project members with appropriate role)
        if (!hasPermission && allowCoOwners) {
          const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: entityId, userId } },
            select: { roleOnProject: true },
          });
          hasPermission = !!membership;
        }
      } else if (entityType === 'researchTopic') {
        // ResearchTopic has no createdBy column in the current schema, so
        // per-entity ownership cannot be checked. This matches the service
        // layer's documented behavior (researchTopic.service.ts): any
        // verified professor may manage topics until an ownership field is
        // added — eligibility itself is already enforced upstream by
        // requireProfessorVerified. See DECISIONS.md (ownership-deferral note).
        return next();
      } else if (entityType === 'publication') {
        const publication = await prisma.publication.findUnique({
          where: { id: entityId },
          include: { authors: { select: { userId: true, authorOrder: true } } },
        });
        if (!publication) throw new NotFoundError("Publication not found");

        // Check if user is an author (first author or any author with permissions)
        const isAuthor = publication.authors.some(
          (a: { userId: string; authorOrder: number }) => a.userId === userId,
        );
        hasPermission = isAuthor;
      } else {
        throw new Error(`Unknown entity type: ${entityType}`);
      }

      if (!hasPermission) {
        throw new ForbiddenError("You do not have permission to manage this resource");
      }

      next();
    } catch (err: unknown) {
      next(err);
    }
  };
}