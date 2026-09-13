import type { Request, Response, NextFunction } from "express";
import * as searchService from "../services/search.service.js";
import type { SearchQuery } from "@app/shared-types";

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, types, limit } = req.query as unknown as SearchQuery;
    res.status(200).json(await searchService.search(q, types, limit));
  } catch (err: unknown) {
    next(err);
  }
}
