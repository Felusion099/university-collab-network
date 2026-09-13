import { Router } from "express";
import { UpdateProfileRequestSchema, UpdatePrivacySettingsRequestSchema } from "@app/shared-types";
import { validateBody } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import * as profileController from "../controllers/profile.controller.js";
import * as skillController from "../controllers/skill.controller.js";

const router = Router();

// Order matters: /me/* routes must be registered before /:username to avoid
// "me" being parsed as a username.
router.get("/me", requireAuth, profileController.getMe);

router.get("/me/onboarding", requireAuth, profileController.getOnboarding);

router.post("/me/onboarding/complete", requireAuth, profileController.completeOnboarding);

router.post("/me/interests", requireAuth, profileController.addInterest);

router.delete("/me/interests/:topicId", requireAuth, profileController.removeInterest);

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

export { router as usersRouter };

router.get("/", optionalAuth, profileController.listByRole);
