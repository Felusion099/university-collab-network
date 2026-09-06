import type { Request, Response, NextFunction } from "express";
import * as profileService from "../services/profile.service.js";
import type { UpdateProfileRequest, UpdatePrivacySettingsRequest } from "@app/shared-types";

export async function getByUsername(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.getProfileByUsername(
      req.params.username as string,
      req.user?.id,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateOwnProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.updateOwnProfile(
      req.user!.id,
      req.body as UpdateProfileRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOwnPrivacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.getOwnPrivacySettings(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateOwnPrivacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.updateOwnPrivacySettings(
      req.user!.id,
      req.body as UpdatePrivacySettingsRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
