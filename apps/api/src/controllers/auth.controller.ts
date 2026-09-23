import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import type {
  SignupRequest,
  LoginRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@app/shared-types";

const REFRESH_COOKIE_NAME = "refresh_token";
// Scoped to the auth routes that actually consume it (refresh, logout) —
// minimizes where the browser sends this cookie.
const REFRESH_COOKIE_PATH = "/api/v1/auth";

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Production deployments serve the web and API from different SITES
    // (e.g. vercel.app → onrender.com): cross-site cookies require
    // SameSite=None + Secure. Lax stays for same-site local dev.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.signup(req.body as SignupRequest);
    res.status(201).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as VerifyEmailRequest;
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await authService.login(
      req.body as LoginRequest,
    );
    setRefreshCookie(res, refreshToken, refreshTokenMaxAgeMs);
    res.status(200).json({ accessToken, user });
  } catch (err: unknown) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    const { accessToken, refreshToken, refreshTokenMaxAgeMs } =
      await authService.refreshTokens(raw);
    setRefreshCookie(res, refreshToken, refreshTokenMaxAgeMs);
    res.status(200).json({ accessToken });
  } catch (err: unknown) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    await authService.logout(raw);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err: unknown) {
    next(err);
  }
}

/**
 * GET /auth/me — resolves HANDOFF-21. requireAuth has already validated the
 * access token and attached req.user (id/email/requestedRole/status) via
 * userRepository.findByIdLean, which never selects passwordHash — so this
 * is a thin, DB-round-trip-free mapping onto AuthenticatedUserSchema,
 * deliberately reusing the exact shape POST /auth/login already returns
 * (see auth.service.ts#toAuthenticatedUser) rather than inventing a new one.
 */
export function me(req: Request, res: Response): void {
  // requireAuth guarantees req.user is set before this handler runs, or
  // calls next(err) instead — see middleware/requireAuth.ts.
  const user = req.user!;
  res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.requestedRole,
    status: user.status,
  });
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordRequest;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, newPassword } = req.body as ResetPasswordRequest;
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}
