import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as groupService from "../services/group.service.js";

/**
 * Groups — personal communication objects with real membership, the ONE
 * JoinRequest invitation mechanism, and secure expiring invite links.
 * All authorization is server-side (owner/member checks in the service).
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await groupService.createGroup(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await groupService.getGroup(req.params.id as string, req.user!.id));
  } catch (err: unknown) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await groupService.listMyGroups(req.user!.id));
  } catch (err: unknown) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await groupService.updateGroup(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    const result = await groupService.inviteToGroup(req.user!.id, req.params.id as string, userId);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function acceptInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.acceptGroupInvitation(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function declineInvitation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.declineGroupInvitation(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    const result = await groupService.removeMember(
      req.user!.id,
      req.params.id as string,
      userId,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await groupService.leaveGroup(req.user!.id, req.params.id as string);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.deleteGroup(req.user!.id, req.params.id as string);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

/* ============================ invite links ============================ */

export async function createInviteLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = z.coerce.number().int().optional().default(24).parse(req.body?.ttlHours);
    const result = await groupService.createInviteLink(
      req.user!.id,
      req.params.id as string,
      parsed,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listInviteLinks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json(await groupService.listInviteLinks(req.user!.id, req.params.id as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function revokeInviteLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.revokeInviteLink(
      req.user!.id,
      req.params.id as string,
      req.params.linkId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

/** Public invite preview (optional auth — the link IS the invitation). */
export async function invitePreview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json(await groupService.getInvitePreview(req.params.token as string));
  } catch (err: unknown) {
    next(err);
  }
}

export async function acceptInviteLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await groupService.acceptInviteLink(req.user!.id, req.params.token as string);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
