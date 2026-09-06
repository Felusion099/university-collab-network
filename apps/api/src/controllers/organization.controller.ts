import type { Request, Response, NextFunction } from "express";
import * as organizationService from "../services/organization.service.js";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { type, category } = req.query as Record<string, string | undefined>;
    res.status(200).json(
      await organizationService.list({
        cursor,
        limit,
        type: type as "club" | "society" | "startup" | undefined,
        category,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await organizationService.getBySlug(req.params.slug as string));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await organizationService.create(
      req.user!.id,
      req.body as CreateOrganizationRequest,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await organizationService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateOrganizationRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await organizationService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await organizationService.join(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await organizationService.leave(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
