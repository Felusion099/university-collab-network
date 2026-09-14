import type { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service.js";
import type { UpdateNotificationPreferencesRequest, PaginationQuery } from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { unreadOnly } = req.query as Record<string, string | undefined>;
    res
      .status(200)
      .json(await notificationService.list(req.user!.id, cursor, limit, unreadOnly === "true"));
  } catch (err: unknown) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.markRead(req.user!.id, req.params.id as string);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function getPreferences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json(await notificationService.getPreferences(req.user!.id));
  } catch (err: unknown) {
    next(err);
  }
}

export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.updatePreferences(
      req.user!.id,
      req.body as UpdateNotificationPreferencesRequest,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.markAllRead(req.user!.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
