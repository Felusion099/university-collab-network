import { Router } from "express";
import {
  CreateConnectionRequestSchema,
  UpdateConnectionRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/connection.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.post("/", validateBody(CreateConnectionRequestSchema), controller.create);
router.patch("/:id", validateBody(UpdateConnectionRequestSchema), controller.updateStatus);

export { router as connectionsRouter };
