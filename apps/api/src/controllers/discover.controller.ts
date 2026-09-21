import type { Request, Response, NextFunction } from "express";
import * as discoverService from "../services/discover.service.js";

export async function discover(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    res.status(200).json(await discoverService.discover(req.user!.id, limit));
  } catch (err: unknown) {
    next(err);
  }
}
