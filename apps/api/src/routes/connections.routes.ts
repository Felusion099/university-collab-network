import { Router } from "express";
import { z } from "zod";
import {
  CreateConnectionRequestSchema,
  UpdateConnectionRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/connection.controller.js";

const router = Router();

// The parsed query must carry `status` (validateQuery replaces req.query —
// unknown keys are stripped, so PaginationQuery alone would drop the filter)
const ConnectionListQuerySchema = PaginationQuerySchema.extend({
  status: z.string().optional(),
});

router.use(requireAuth);
router.get("/", validateQuery(ConnectionListQuerySchema), controller.list);
router.post("/", validateBody(CreateConnectionRequestSchema), controller.create);
router.patch("/:id", validateBody(UpdateConnectionRequestSchema), controller.updateStatus);
// Cancel an outgoing pending request — sender only (server-authorized)
router.delete("/:id", controller.cancel);

export { router as connectionsRouter };
