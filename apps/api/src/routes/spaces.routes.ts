import { Router } from "express";
import {
  CreateSpaceRequestSchema,
  UpdateSpaceRequestSchema,
  PinMessageRequestSchema,
  EditMessageRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { z } from "zod";
import { validateBody, validateQuery, validateParams } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as spaceController from "../controllers/space.controller.js";
import * as conversationController from "../controllers/conversation.controller.js";

const IdParamSchema = z.object({ id: z.string().uuid() });
const MessageIdParamSchema = z.object({ id: z.string().uuid(), messageId: z.string().uuid() });
const SpaceAddMemberSchema = z.object({ userId: z.string().uuid() });

/**
 * Collaboration Spaces — the ONE reusable communication/collaboration layer
 * (Phase CS). PROJECT spaces sync membership from ProjectMember (the source
 * of truth); independent spaces manage their own lifecycle (open /
 * request_to_join / invite_only). All authorization is server-side.
 */
const router = Router();

// Discovery (public/university_only only — private never listed)
router.get("/", requireAuth, validateQuery(PaginationQuerySchema), spaceController.list);
router.get("/mine", requireAuth, spaceController.listMine);
// Project ↔ Space both directions (visibility rules apply)
router.get("/by-project/:projectId", requireAuth, spaceController.getByProject);

router.post("/", requireAuth, validateBody(CreateSpaceRequestSchema), spaceController.create);
router.get("/:id", requireAuth, spaceController.get);
router.patch("/:id", requireAuth, validateBody(UpdateSpaceRequestSchema), spaceController.update);
router.delete("/:id", requireAuth, spaceController.deleteSpace);

// Join flow per membership mode (open → direct; request_to_join → pending
// request; invite_only → forbidden). Independent spaces only — project-linked
// members join via the project's join flow (sync handles the space).
router.post("/:id/join", requireAuth, spaceController.join);
router.post("/:id/leave", requireAuth, spaceController.leave);
router.post("/:id/members/remove", requireAuth, validateBody(SpaceAddMemberSchema), spaceController.removeMember);

// Join requests (REQUEST_TO_JOIN) — owner/admin approves/rejects
router.post("/:id/join-requests", requireAuth, spaceController.join);
router.get("/:id/join-requests", requireAuth, spaceController.listJoinRequests);
router.patch("/join-requests/:requestId/approve", requireAuth, spaceController.approveJoinRequest);
router.patch("/join-requests/:requestId/reject", requireAuth, spaceController.rejectJoinRequest);

// Admins (owner-only promote/demote)
router.post("/:id/admins", requireAuth, validateBody(SpaceAddMemberSchema), spaceController.addAdmin);
router.delete("/:id/admins/:userId", requireAuth, spaceController.removeAdmin);

// Pinned messages (space admin/owner pins; members read)
router.get("/:id/pinned", requireAuth, spaceController.listPinned);
router.post("/:id/pin", requireAuth, validateBody(PinMessageRequestSchema), spaceController.pinMessage);

// Space chat reuses the EXISTING conversation architecture — the space's
// conversationId works with every /conversations endpoint (messages, stream,
// read). Message edit (sender-only) + delete (sender or space admin/owner):
router.patch(
  "/:id/messages/:messageId",
  requireAuth,
  validateParams(MessageIdParamSchema),
  validateBody(EditMessageRequestSchema),
  conversationController.editMessage,
);
router.delete(
  "/:id/messages/:messageId",
  requireAuth,
  validateParams(MessageIdParamSchema),
  conversationController.deleteMessage,
);

export default router;

export { router as spacesRouter };
