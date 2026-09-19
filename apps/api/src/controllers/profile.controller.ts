import { userRepository } from "../repositories/index.js";
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
  } catch (err: unknown) {
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
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    next(err);
  }
}

// GET /users/me — the caller's own profile (owner view). The JWT carries
// no username, so /users/:username cannot address self; this reuses the
// same composition + privacy pipeline as getProfileByUsername.
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.getOwnProfile(req.user!.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// GET /users/me/onboarding — onboarding status (users.onboarding_completed_at).
export async function getOnboarding(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.getOnboardingStatus(req.user!.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// POST /users/me/onboarding/complete — marks onboarding done.
export async function completeOnboarding(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.completeOnboarding(req.user!.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// POST /users/me/interests — link the caller to a research topic
// (existing user_research_topics table).
export async function addInterest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { topicId } = req.body as { topicId: string };
    const result = await profileService.addOwnInterest(req.user!.id, topicId);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// DELETE /users/me/interests/:topicId — unlink a research topic.
export async function removeInterest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.removeOwnInterest(
      req.user!.id,
      req.params.topicId as string,
    );
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// GET /users/me/verification — the caller's verification status using the
// existing Verification model (request row + university verification).
export async function getVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await profileService.getOwnVerificationStatus(req.user!.id);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// POST /users/me/verification — submit a verification request
// (status: pending, goes to admin review via the existing workflow).
export async function requestVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { roleClaimed, evidenceUrl } = req.body as {
      roleClaimed?: string;
      evidenceUrl?: string;
    };
    const result = await profileService.requestVerification(req.user!.id, {
      roleClaimed,
      evidenceUrl,
    });
    res.status(200).json(result);
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    next(err);
  }
}

export async function listByRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, limit = 20, cursor } = req.query;
    const result = await userRepository.findByRole(role as string, Number(limit), cursor as string);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

// PATCH /users/me/status — onboarding STATUS step (spec §13). The user's
// academic/professional status; only the five persona statuses are valid.
// Never grants capabilities — privileged actions still require Verification.
export async function updateOwnStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status } = req.body as { status: string };
    const result = await profileService.updateOwnStatus(req.user!.id, status);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
