import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import * as controller from "../controllers/group.controller.js";

/**
 * Groups — personal communication objects. All authorization server-side;
 * the invite preview is public (the link IS the invitation context), but
 * JOINING always requires authentication + server validation.
 */
const router = Router();

router.get("/mine", requireAuth, controller.listMine);

// Public invite-link preview + authenticated acceptance (secure opaque
// token — never the group id). Registered before /:id.
router.get("/join/:token", optionalAuth, controller.invitePreview);
router.post("/join/:token", requireAuth, controller.acceptInviteLink);

router.post("/", requireAuth, controller.create);
router.get("/:id", requireAuth, controller.get);
router.patch("/:id", requireAuth, controller.update);

// Owner: invite (JoinRequest pending + notification), remove member
router.post("/:id/invitations", requireAuth, controller.invite);
router.post("/:id/members/remove", requireAuth, controller.removeMember);
router.post("/:id/leave", requireAuth, controller.leave);
router.delete("/:id", requireAuth, controller.deleteGroup);

// Invitee: accept/decline via the EXISTING requests center
router.patch("/invitations/:requestId/accept", requireAuth, controller.acceptInvitation);
router.patch("/invitations/:requestId/decline", requireAuth, controller.declineInvitation);

// Owner: invite links (secure token, expiry required)
router.post("/:id/invite-links", requireAuth, controller.createInviteLink);
router.get("/:id/invite-links", requireAuth, controller.listInviteLinks);
router.delete("/:id/invite-links/:linkId", requireAuth, controller.revokeInviteLink);

export { router as groupsRouter };
