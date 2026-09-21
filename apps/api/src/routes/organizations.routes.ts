import { Router } from "express";
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

export { router as organizationsRouter };
