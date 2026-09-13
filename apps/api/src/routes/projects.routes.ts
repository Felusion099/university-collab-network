import { Router } from "express";
import { z } from "zod";
import {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireProfessorVerified, requireProfessorOwnership } from "../middleware/requireProfessorOwnership.js";
import * as controller from "../controllers/project.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateProjectRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateProjectRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);
router.get("/:id/matches", requireAuth, controller.matches);

// ============================================================================
// PROFESSOR PROJECT ENDPOINTS (Phase 9+)
// ============================================================================

// Professor adds a member to their project
router.post(
  "/professor/:id/members",
  requireAuth,
  requireProfessorOwnership('project', 'id'),
  validateBody(z.object({ userId: z.string().uuid(), roleOnProject: z.string().optional() })),
  controller.addMemberByProfessor
);

// Professor removes a member from their project
router.delete(
  "/professor/:id/members/:userId",
  requireAuth,
  requireProfessorOwnership('project', 'id'),
  controller.removeMemberByProfessor
);

// Professor updates a member's role in their project
router.patch(
  "/professor/:id/members/:userId",
  requireAuth,
  requireProfessorOwnership('project', 'id'),
  validateBody(z.object({ roleOnProject: z.string() })),
  controller.updateMemberRoleByProfessor
)

// Professor updates their project lifecycle status
router.patch(
  "/professor/:id/status",
  requireAuth,
  requireProfessorOwnership('project', 'id'),
  validateBody(z.object({ status: z.string() })),
  controller.updateStatusByProfessor
)

// Professor lists their own projects
router.get(
  "/professor/me",
  requireAuth,
  requireProfessorVerified,
  validateQuery(PaginationQuerySchema),
  controller.listByProfessor
);

export { router as projectsRouter };
