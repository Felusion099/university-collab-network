import type { Request, Response, NextFunction } from "express";
import * as opportunityService from "../services/opportunity.service.js";
import type {
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  UpdateApplicationRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { type, department, deadlineBefore, skill } = req.query as Record<
      string,
      string | undefined
    >;
    res
      .status(200)
      .json(
        await opportunityService.list({ cursor, limit, type, department, deadlineBefore, skill }),
      );
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await opportunityService.getById(req.params.id as string));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await opportunityService.create(
      req.user!.id,
      req.body as CreateOpportunityRequest,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await opportunityService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateOpportunityRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await opportunityService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function apply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await opportunityService.apply(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status } = req.body as UpdateApplicationRequest;
    const result = await opportunityService.updateApplicationStatus(
      req.user!.id,
      req.params.id as string,
      req.params.applicationId as string,
      status,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
