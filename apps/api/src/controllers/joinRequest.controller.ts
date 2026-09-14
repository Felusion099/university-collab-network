import type { Request, Response, NextFunction } from "express";
import * as joinRequestService from "../services/joinRequest.service.js";

/**
 * JoinRequest controller — user requests, creator reviews, invitations
 * accepted/declined. All authorization is server-side (service asserts
 * creator/PI authority); the frontend never decides.
 */
export async function requestToJoinProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { message } = req.body as { message?: string };
    const result = await joinRequestService.requestToJoinProject(
      req.user!.id,
      req.params.id as string,
      message,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listProjectRequests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as { cursor?: string; limit?: number };
    const result = await joinRequestService.listForProject(
      req.user!.id,
      req.params.id as string,
      cursor,
      Number(limit) || 20,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function acceptProjectRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await joinRequestService.acceptProjectJoinRequest(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function rejectProjectRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await joinRequestService.rejectProjectJoinRequest(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function inviteToProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.body as { userId: string };
    const result = await joinRequestService.inviteToProject(
      req.user!.id,
      req.params.id as string,
      userId,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function requestToJoinTeam(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { message } = req.body as { message?: string };
    const result = await joinRequestService.requestToJoinTeam(
      req.user!.id,
      req.params.id as string,
      message,
    );
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listTeamRequests(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as { cursor?: string; limit?: number };
    const result = await joinRequestService.listForTeam(
      req.user!.id,
      req.params.id as string,
      cursor,
      Number(limit) || 20,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function acceptTeamRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await joinRequestService.acceptTeamJoinRequest(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function rejectTeamRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await joinRequestService.rejectTeamJoinRequest(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await joinRequestService.listMine(req.user!.id);
    res.status(200).json(result);
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
    const result = await joinRequestService.acceptInvitation(
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
    const result = await joinRequestService.declineInvitation(
      req.user!.id,
      req.params.requestId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
