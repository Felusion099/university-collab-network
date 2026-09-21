import type { Request, Response, NextFunction } from "express";
import * as connectionService from "../services/connection.service.js";
import type {
  CreateConnectionRequest,
  UpdateConnectionRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { addresseeId, message } = req.body as CreateConnectionRequest;
    const result = await connectionService.create(req.user!.id, addresseeId, message);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body as UpdateConnectionRequest;
    const result = await connectionService.updateStatus(
      req.user!.id,
      req.params.id as string,
      status,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { status } = req.query as Record<string, string | undefined>;
    res.status(200).json(await connectionService.list(req.user!.id, cursor, limit, status));
  } catch (err: unknown) {
    next(err);
  }
}
