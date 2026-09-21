import type { Request, Response, NextFunction } from "express";
import * as researchTopicService from "../services/researchTopic.service.js";
import type {
  CreateResearchTopicRequest,
  UpdateResearchTopicRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    res.status(200).json(await researchTopicService.list(cursor, limit));
  } catch (err: unknown) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res
      .status(200)
      .json(await researchTopicService.getBySlug(req.params.slug as string, req.user?.id));
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================================
// PROFESSOR RESEARCH TOPIC ENDPOINTS (Phase 9+)
// Professor eligibility/ownership is enforced at the route level via
// requireProfessorVerified / requireProfessorOwnership middleware, so the
// controllers here only translate the request to a service call.
// ============================================================================

// Professor creates a new research topic (requires verified professor)
export async function createByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTopicService.createByProfessor(
      req.user!.id,
      req.body as CreateResearchTopicRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates their own research topic (requires ownership)
export async function updateByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTopicService.updateByProfessor(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateResearchTopicRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor deletes/archives their own research topic (requires ownership)
export async function removeByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTopicService.removeByProfessor(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates their own research topic lifecycle status
export async function updateStatusByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTopicService.updateStatusByProfessor(
      req.user!.id,
      req.params.id as string,
      req.body.status as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor lists their own research topics
export async function listByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as { cursor?: string; limit?: number };
    const result = await researchTopicService.listByProfessor(req.user!.id, cursor, limit);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTopicService.create(
      req.user!.requestedRole,
      req.body as CreateResearchTopicRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTopicService.update(
      req.user!.requestedRole,
      req.params.id as string,
      req.body as UpdateResearchTopicRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTopicService.remove(req.user!.requestedRole, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}
