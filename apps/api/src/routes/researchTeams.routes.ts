import { Router } from "express";
import {
  CreateResearchTeamRequestSchema,
  UpdateResearchTeamRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/researchTeam.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreateResearchTeamRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateResearchTeamRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);
router.post("/:id/join", requireAuth, controller.join);
router.post("/:id/leave", requireAuth, controller.leave);

export { router as researchTeamsRouter };
