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
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res
      .status(200)
      .json(await researchTopicService.getBySlug(req.params.slug as string, req.user?.id));
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTopicService.remove(req.user!.requestedRole, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
