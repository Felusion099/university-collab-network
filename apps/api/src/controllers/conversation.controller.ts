import type { Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversation.service.js";
import type {
  CreateConversationRequest,
  CreateMessageRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await conversationService.create(
      req.user!.id,
      req.body as CreateConversationRequest,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    res.status(200).json(await conversationService.list(req.user!.id, cursor, limit));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await conversationService.getById(req.user!.id, req.params.id as string));
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    res
      .status(200)
      .json(
        await conversationService.listMessages(
          req.user!.id,
          req.params.id as string,
          cursor,
          limit,
        ),
      );
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await conversationService.sendMessage(
      req.user!.id,
      req.params.id as string,
      req.body as CreateMessageRequest,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
