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
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await publicationService.getById(req.params.id as string));
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await publicationService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
