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
import { optionalAuth } from "../middleware/optionalAuth.js";
import * as controller from "../controllers/project.controller.js";
import * as joinRequests from "../controllers/joinRequest.controller.js";

const router = Router();

// The parsed query must carry every filter (validateQuery replaces
// req.query — unknown keys are stripped)
const ProjectListQuerySchema = PaginationQuerySchema.extend({
  status: z.string().optional(),
  skill: z.string().optional(),
  topic: z.string().optional(),
  lookingFor: z.string().optional(),
});

router.get("/", optionalAuth, validateQuery(ProjectListQuerySchema), controller.list);
router.get("/:id", optionalAuth, controller.getById);
router.post("/", requireAuth, validateBody(CreateProjectRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateProjectRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);
router.get("/:id/matches", requireAuth, controller.matches);
// Owner removes a teammate — server-authorized (owner-only)
router.delete("/:id/members/:userId", requireAuth, controller.removeMember);

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

// ============================================================================
// JOIN REQUESTS / INVITATIONS — one mechanism, real membership on accept
// ============================================================================

// User requests to join a project (pending; creator is notified)
router.post("/:id/join-requests", requireAuth, joinRequests.requestToJoinProject);

// Creator lists pending requests for THEIR project (server-authorized)
router.get("/:id/join-requests", requireAuth, joinRequests.listProjectRequests);

// Creator accepts / rejects → acceptance CREATES the real membership
router.patch(
  "/:id/join-requests/:requestId/accept",
  requireAuth,
  joinRequests.acceptProjectRequest
);
router.patch(
  "/:id/join-requests/:requestId/reject",
  requireAuth,
  joinRequests.rejectProjectRequest
);

// Creator invites a user (pending invitation; invitee is notified)
router.post("/:id/invitations", requireAuth, joinRequests.inviteToProject);

export { router as projectsRouter };
