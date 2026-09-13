import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import type { UserRole, UserStatus } from "@app/shared-types";

export interface RequestUser {
  id: string;
  email: string;
  requestedRole: UserRole;
  status: UserStatus;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: RequestUser;
  }
}

/**
 * Validates the JWT access token (Authorization: Bearer <token>) and
 * attaches req.user. Per ARCHITECTURE.md §3 step 5, this middleware only
 * establishes identity — privileged-role authorization is a separate
 * concern handled by requireRole (DECISIONS.md D-003).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }

    const user = await userRepository.findByIdLean(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    if (user.status === "suspended" || user.status === "banned") {
      throw new AppError("This account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      requestedRole: user.requestedRole as UserRole,
      status: user.status as UserStatus,
    };

    next();
  } catch (err: unknown) {
    next(err);
  }
}
