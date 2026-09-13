import type { Request, Response, NextFunction } from "express";
import * as researchTeamService from "../services/researchTeam.service.js";
import type {
  CreateResearchTeamRequest,
  UpdateResearchTeamRequest,
  MembershipRole,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { topic } = req.query as Record<string, string | undefined>;
    res.status(200).json(await researchTeamService.list({ cursor, limit, topic }));
  } catch (err: unknown) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await researchTeamService.getById(req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

// Original CRUD endpoints (for general use)
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.create(
      req.user!.id,
      req.body as CreateResearchTeamRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateResearchTeamRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTeamService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}
// ============================================================================
// PROFESSOR RESEARCH TEAM ENDPOINTS (Phase 9+)
// Eligibility/ownership is enforced at the route level via
// requireProfessorVerified / requireProfessorOwnership middleware.
// ============================================================================

// Professor creates a new research team (requires verified professor)
export async function createByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.createByProfessor(
      req.user!.id,
      req.body as CreateResearchTeamRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor lists their own research teams
export async function listByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit, topic } = req.query as unknown as { cursor?: string; limit?: number; topic?: string };
    const result = await researchTeamService.listByProfessor(req.user!.id, cursor, limit, topic);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates their own research team (requires ownership)
export async function updateByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.updateByProfessor(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateResearchTeamRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor deletes/archives their own research team
export async function removeByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTeamService.removeByProfessor(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// Professor adds a member to their research team
export async function addMemberByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, role } = req.body as { userId: string; role?: MembershipRole };
    const result = await researchTeamService.addMemberByProfessor(
      req.user!.id,
      req.params.id as string,
      userId,
      role,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor removes a member from their research team
export async function removeMemberByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    await researchTeamService.removeMemberByProfessor(req.user!.id, req.params.id as string, userId);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates a member's role in their research team
export async function updateMemberRoleByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, role } = req.body as { userId: string; role: MembershipRole };
    const result = await researchTeamService.updateMemberRoleByProfessor(
      req.user!.id,
      req.params.id as string,
      userId,
      role,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor transfers PI ownership of their research team
export async function transferPIOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { newPIUserId } = req.body as { newPIUserId: string };
    const result = await researchTeamService.transferPIOwnership(
      req.user!.id,
      req.params.id as string,
      newPIUserId,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.join(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTeamService.leave(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}
