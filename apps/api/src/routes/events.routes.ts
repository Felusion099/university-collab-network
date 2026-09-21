import { Router } from "express";
import {
  CreateEventRequestSchema,
  UpdateEventRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/event.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateEventRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateEventRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/register", requireAuth, controller.register);

export { router as eventsRouter };
