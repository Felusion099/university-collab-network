import type { Request, Response, NextFunction } from "express";
import * as noticeService from "../services/notice.service.js";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as { cursor?: string; limit?: number };
    res.status(200).json(await noticeService.list(cursor, Number(limit) || 20));
  } catch (err: unknown) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await noticeService.getById(req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await noticeService.create(req.user!.id, req.body as never);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await noticeService.update(req.user!.id, req.params.id as string, req.body as never);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await noticeService.remove(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}
