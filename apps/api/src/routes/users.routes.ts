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
