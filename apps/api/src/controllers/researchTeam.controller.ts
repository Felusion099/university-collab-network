import type { Request, Response, NextFunction } from "express";
import * as researchTeamService from "../services/researchTeam.service.js";
import type {
  CreateResearchTeamRequest,
  UpdateResearchTeamRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { topic } = req.query as Record<string, string | undefined>;
    res.status(200).json(await researchTeamService.list({ cursor, limit, topic }));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await researchTeamService.getById(req.params.id as string));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.create(
      req.user!.id,
      req.body as CreateResearchTeamRequest,
    );
    res.status(201).json(result);
  } catch (err) {
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
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTeamService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await researchTeamService.join(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await researchTeamService.leave(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
