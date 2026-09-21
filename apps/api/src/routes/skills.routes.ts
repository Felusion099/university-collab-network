import { Router } from "express";
import { CreateSkillRequestSchema, PaginationQuerySchema } from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/skill.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.post("/", requireAuth, validateBody(CreateSkillRequestSchema), controller.create);
router.post("/:id/self", requireAuth, controller.addToSelf);
router.delete("/:id/self", requireAuth, controller.removeFromSelf);

export { router as skillsRouter };
