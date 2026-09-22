import { Router } from "express";
import { z } from "zod";
import {
  CreateOrganizationRequestSchema,
  UpdateOrganizationRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/organization.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:slug", controller.getBySlug);
router.post("/", requireAuth, validateBody(CreateOrganizationRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateOrganizationRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);
// Community role hierarchy — rank-enforced server-side (Discord-like:
// nobody manages at-or-above their own rank)
router.patch("/:id/members/:userId", requireAuth, validateBody(z.object({ role: z.string(), roleTitle: z.string().optional() })), controller.assignRole);
router.delete("/:id/members/:userId", requireAuth, controller.removeMember);
router.post("/:id/transfer-ownership", requireAuth, validateBody(z.object({ userId: z.string().uuid() })), controller.transferOwnership);

export { router as organizationsRouter };
