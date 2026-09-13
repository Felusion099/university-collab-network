import { Router } from "express";
import {
  CreateResearchTopicRequestSchema,
  UpdateResearchTopicRequestSchema,
  UpdateResearchTopicStatusRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireProfessorVerified, requireProfessorOwnership } from "../middleware/requireProfessorOwnership.js";
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

// ============================================================================
// PROFESSOR RESEARCH TOPIC ENDPOINTS (Phase 9+)
// ============================================================================
// Professor creates a new research topic (requires verified professor)
router.post(
  "/professor",
  requireAuth,
  requireProfessorVerified,
  validateBody(CreateResearchTopicRequestSchema),
  controller.createByProfessor
);

// Professor lists their own research topics
router.get(
  "/professor/me",
  requireAuth,
  requireProfessorVerified,
  validateQuery(PaginationQuerySchema),
  controller.listByProfessor
);

// Professor gets their own research topic by ID
router.get(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTopic', 'id'),
  controller.getBySlug
);

// Professor updates their own research topic
router.patch(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTopic', 'id'),
  validateBody(UpdateResearchTopicRequestSchema),
  controller.updateByProfessor
);

// Professor deletes/archives their own research topic
router.delete(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTopic', 'id'),
  controller.removeByProfessor
);

// Professor updates their own research topic lifecycle status
router.patch(
  "/professor/:id/status",
  requireAuth,
  requireProfessorOwnership('researchTopic', 'id'),
  validateBody(UpdateResearchTopicStatusRequestSchema),
  controller.updateStatusByProfessor
);

export { router as researchTopicsRouter };
