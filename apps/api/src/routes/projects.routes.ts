import { Router } from "express";
import {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/project.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateProjectRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateProjectRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);
router.get("/:id/matches", requireAuth, controller.matches);

export { router as projectsRouter };
