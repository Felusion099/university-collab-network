import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./requireAuth.js";

/**
 * Attaches req.user if a valid Bearer token is present, but never rejects —
 * for routes that must stay readable logged-out (public profile pages,
 * public topic pages) but still want to know who the caller is *when*
 * they're logged in, so viewer-aware privacy filtering
 * (privacy.service.ts's `filterProfileForViewer`/`isAllowed`) can use
 * accurate `isUniversityMember`/`isConnected` context instead of always
 * treating every caller as anonymous. An invalid/expired token degrades to
 * "anonymous viewer" rather than a 401, since the caller never claimed
 * authentication was required.
 *
 * Originally defined inline in users.routes.ts; extracted here per
 * DECISIONS.md D-019 so researchTopics.routes.ts's GET /:slug (which has
 * the exact same "public but privacy-sensitive" shape — see D-019) can
 * reuse it instead of drifting out of sync with a second copy.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.headers.authorization) {
    next();
    return;
  }
  requireAuth(req, res, (err?: unknown) => {
    if (err) {
      next();
      return;
    }
    next();
  });
}
