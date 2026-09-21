import { Router } from "express";
import { UpdateProfileRequestSchema, UpdatePrivacySettingsRequestSchema } from "@app/shared-types";
import { validateBody } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import * as profileController from "../controllers/profile.controller.js";
import * as skillController from "../controllers/skill.controller.js";
import * as joinRequestController from "../controllers/joinRequest.controller.js";

const router = Router();

// Order matters: /me/* routes must be registered before /:username to avoid
// "me" being parsed as a username.
router.get("/me", requireAuth, profileController.getMe);

router.get("/me/onboarding", requireAuth, profileController.getOnboarding);

router.patch("/me/status", requireAuth, profileController.updateOwnStatus);

router.post("/me/onboarding/complete", requireAuth, profileController.completeOnboarding);

router.post("/me/interests", requireAuth, profileController.addInterest);

router.delete("/me/interests/:topicId", requireAuth, profileController.removeInterest);

router.get("/me/verification", requireAuth, profileController.getVerification);

router.post("/me/verification", requireAuth, profileController.requestVerification);

router.patch(
  "/me/profile",
  requireAuth,
  validateBody(UpdateProfileRequestSchema),
  profileController.updateOwnProfile,
);

router.get("/me/privacy", requireAuth, profileController.getOwnPrivacy);

router.post("/me/skills", requireAuth, skillController.addSkillToSelf);

router.patch(
  "/me/privacy",
  requireAuth,
  validateBody(UpdatePrivacySettingsRequestSchema),
  profileController.updateOwnPrivacy,
);

router.get("/:username", optionalAuth, profileController.getByUsername);

// ============================================================================
// MY REQUESTS / INVITATIONS — things requiring the caller's decision
// ============================================================================

router.get("/me/join-requests", requireAuth, joinRequestController.listMine);
router.patch(
  "/me/join-requests/:requestId/accept",
  requireAuth,
  joinRequestController.acceptInvitation
);
router.patch(
  "/me/join-requests/:requestId/decline",
  requireAuth,
  joinRequestController.declineInvitation
);

export { router as usersRouter };

router.get("/", optionalAuth, profileController.listByRole);
