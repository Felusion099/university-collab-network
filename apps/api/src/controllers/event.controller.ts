import type { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service.js";
import type { CreateEventRequest, UpdateEventRequest, PaginationQuery } from "@app/shared-types";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { eventType, upcoming } = req.query as Record<string, string | undefined>;
    res
      .status(200)
      .json(await eventService.list({ cursor, limit, eventType, upcoming: upcoming === "true" }));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await eventService.getById(req.params.id as string));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventService.create(req.user!.id, req.body as CreateEventRequest);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventService.update(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateEventRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await eventService.remove(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventService.register(req.user!.id, req.params.id as string);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
