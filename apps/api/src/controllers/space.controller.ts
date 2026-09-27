import type { Request, Response, NextFunction } from "express";
import * as spaceService from "../services/space.service.js";

/**
 * Collaboration Spaces — the ONE reusable communication/collaboration layer
 * for projects, communities, clubs, research groups, study groups, events,
 * and startup teams. PROJECT spaces sync membership from ProjectMember (the
 * source of truth); independent spaces manage their own membership lifecycle.
 * All authorization is server-side (space.service role checks).
 */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await spaceService.listSpaces(req.user!.id, {
      type: req.query.type as string | undefined,
      q: req.query.q as string | undefined,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.listMySpaces(req.user!.id));
  } catch (err: unknown) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await spaceService.createSpace(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.getSpace(req.params.id as string, req.user!.id));
  } catch (err: unknown) {
    next(err);
  }
}

export async function getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Resolves the project's linked Collaboration Space (Project ↔ Space both
    // directions). Visibility rules apply like getSpace.
    const space = await spaceService.findSpaceByProject(req.params.projectId as string, req.user!.id);
    res.json(space);
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.updateSpace(req.user!.id, req.params.id as string, req.body));
  } catch (err: unknown) {
    next(err);
  }
}

export async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.joinSpace(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.leaveSpace(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function listJoinRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.listJoinRequests(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function approveJoinRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.approveJoinRequest(req.user!.id, req.params.requestId as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function rejectJoinRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.rejectJoinRequest(req.user!.id, req.params.requestId as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function addAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.addSpaceAdmin(req.user!.id, req.params.id as string, req.body.userId));
  } catch (err: unknown) {
    next(err);
  }
}

export async function removeAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.removeSpaceAdmin(req.user!.id, req.params.id as string, req.params.userId as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.removeMember(req.user!.id, req.params.id as string, req.body.userId));
  } catch (err: unknown) {
    next(err);
  }
}

export async function pinMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.setMessagePinned(req.user!.id, req.params.id as string, req.body.messageId, req.body.pinned));
  } catch (err: unknown) {
    next(err);
  }
}

export async function listPinned(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.listPinnedMessages(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function deleteSpace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await spaceService.deleteSpace(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}
