import { Router } from "express";
import {
  CreateOpportunityRequestSchema,
  UpdateOpportunityRequestSchema,
  UpdateApplicationRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/opportunity.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateOpportunityRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateOpportunityRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/apply", requireAuth, controller.apply);
router.patch(
  "/:id/applications/:applicationId",
  requireAuth,
  validateBody(UpdateApplicationRequestSchema),
  controller.updateApplication,
);

export { router as opportunitiesRouter };
