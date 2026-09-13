import { Router } from "express";
import { z } from "zod";
import {
  CreateResearchTeamRequestSchema,
  UpdateResearchTeamRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireProfessorVerified, requireProfessorOwnership } from "../middleware/requireProfessorOwnership.js";
import * as controller from "../controllers/researchTeam.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateResearchTeamRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateResearchTeamRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);

// ============================================================================
// PROFESSOR RESEARCH TEAM ENDPOINTS (Phase 9+)
// ============================================================================
// Professor creates a new research team (requires verified professor)
router.post(
  "/professor",
  requireAuth,
  requireProfessorVerified,
  validateBody(CreateResearchTeamRequestSchema),
  controller.createByProfessor
);

// Professor lists their own research teams
router.get(
  "/professor/me",
  requireAuth,
  requireProfessorVerified,
  validateQuery(PaginationQuerySchema),
  controller.listByProfessor
);

// Professor gets their own research team by ID
router.get(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  controller.getById
);

// Professor updates their own research team
router.patch(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  validateBody(UpdateResearchTeamRequestSchema),
  controller.updateByProfessor
);

// Professor deletes/archives their own research team
router.delete(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  controller.removeByProfessor
);

// Professor adds a member to their research team
router.post(
  "/professor/:id/members",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  validateBody(z.object({ userId: z.string().uuid(), role: z.enum(["member", "researcher", "student", "contributor"]).optional() })),
  controller.addMemberByProfessor
);

// Professor removes a member from their research team
router.delete(
  "/professor/:id/members/:userId",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  controller.removeMemberByProfessor
);

// Professor updates a member's role in their research team
router.patch(
  "/professor/:id/members/:userId",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  validateBody(z.object({ role: z.enum(["member", "researcher", "student", "contributor", "advisor"]) })),
  controller.updateMemberRoleByProfessor
);

// Professor transfers PI ownership of their research team
router.patch(
  "/professor/:id/transfer-pi",
  requireAuth,
  requireProfessorOwnership('researchTeam', 'id'),
  validateBody(z.object({ newPIUserId: z.string().uuid() })),
  controller.transferPIOwnership
);

export { router as researchTeamsRouter };
