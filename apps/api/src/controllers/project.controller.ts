import type { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { status, skill, topic, lookingFor } = req.query as Record<string, string | undefined>;
    res
      .status(200)
      .json(await projectService.list({ cursor, limit, status, skill, topic, lookingFor }));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await projectService.getById(req.params.id as string));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await projectService.create(req.user!.id, req.body as CreateProjectRequest);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await projectService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateProjectRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roleOnProject } = req.body as { roleOnProject?: string };
    const result = await projectService.join(req.user!.id, req.params.id as string, roleOnProject);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.leave(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function matches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await projectService.findMatches(req.user!.id, req.params.id as string, limit);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
