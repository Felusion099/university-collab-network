import { Router } from "express";
import {
  CreateResearchTopicRequestSchema,
  UpdateResearchTopicRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import * as controller from "../controllers/researchTopic.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
// optionalAuth per DECISIONS.md D-019: this listing embeds each interested
// user's profile, gated by their own `researchVisibility` (and, within
// that, their own cgpa/social-links/academic-info settings) — the same
// viewer-aware privacy filtering GET /users/:username applies, so it needs
// the same "identify the caller if logged in, but never require it" auth.
router.get("/:slug", optionalAuth, controller.getBySlug);
router.post("/", requireAuth, validateBody(CreateResearchTopicRequestSchema), controller.create);
router.patch(
  "/:id",
  requireAuth,
  validateBody(UpdateResearchTopicRequestSchema),
  controller.update,
);
router.delete("/:id", requireAuth, controller.remove);

export { router as researchTopicsRouter };
