import type { Request, Response, NextFunction } from "express";
import * as publicationService from "../services/publication.service.js";
import type {
  CreatePublicationRequest,
  UpdatePublicationRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { topic } = req.query as Record<string, string | undefined>;
    res.status(200).json(await publicationService.list({ cursor, limit, topic }));
  } catch (err: unknown) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await publicationService.getById(req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await publicationService.create(
      req.user!.id,
      req.body as CreatePublicationRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await publicationService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdatePublicationRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await publicationService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// ============================================================================
// PROFESSOR PUBLICATION ENDPOINTS (Phase 9+)
// Eligibility/ownership is enforced at the route level via
// requireProfessorVerified / requireProfessorOwnership middleware.
// ============================================================================

// Professor creates a publication (must include themselves as author)
export async function createByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await publicationService.createByProfessor(
      req.user!.id,
      req.body as CreatePublicationRequest,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates their publication (must be an author)
export async function updateByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await publicationService.updateByProfessor(
      req.user!.id,
      req.params.id as string,
      req.body as UpdatePublicationRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor removes their publication
export async function removeByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await publicationService.removeByProfessor(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// Professor adds a co-author to their publication
export async function addAuthorByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { authorId, authorOrder } = req.body as { authorId: string; authorOrder: number };
    const result = await publicationService.addAuthorByProfessor(
      req.user!.id,
      req.params.id as string,
      authorId,
      authorOrder,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor removes an author from their publication
export async function removeAuthorByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { authorId } = req.body as { authorId: string };
    await publicationService.removeAuthorByProfessor(req.user!.id, req.params.id as string, authorId);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

// Professor updates author order in their publication
export async function updateAuthorOrderByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { authorId, authorOrder } = req.body as { authorId: string; authorOrder: number };
    const result = await publicationService.updateAuthorOrderByProfessor(
      req.user!.id,
      req.params.id as string,
      authorId,
      authorOrder,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// Professor lists their own publications
export async function listByProfessor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as { cursor?: string; limit?: number };
    const result = await publicationService.listByProfessor(req.user!.id, cursor, limit);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
