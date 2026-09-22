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
  } catch (err: unknown) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await organizationService.getBySlug(req.params.slug as string));
  } catch (err: unknown) {
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
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await organizationService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await organizationService.join(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await organizationService.leave(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

export async function assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, roleTitle } = req.body as { role: string; roleTitle?: string };
    const result = await organizationService.assignRole(req.user!.id, req.params.id as string, req.params.userId as string, { role, roleTitle });
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await organizationService.removeMember(req.user!.id, req.params.id as string, req.params.userId as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function transferOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    res.status(200).json(await organizationService.transferOwnership(req.user!.id, req.params.id as string, userId));
  } catch (err: unknown) {
    next(err);
  }
}