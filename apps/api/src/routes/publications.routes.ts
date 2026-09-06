import { Router } from "express";
import {
  CreatePublicationRequestSchema,
  UpdatePublicationRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/publication.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreatePublicationRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdatePublicationRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);

export { router as publicationsRouter };
