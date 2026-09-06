import { Router } from "express";
import {
  CreateConversationRequestSchema,
  CreateMessageRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/conversation.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.post("/", validateBody(CreateConversationRequestSchema), controller.create);
router.get("/:id", controller.getById);
router.get("/:id/messages", validateQuery(PaginationQuerySchema), controller.listMessages);
router.post("/:id/messages", validateBody(CreateMessageRequestSchema), controller.sendMessage);

export { router as conversationsRouter };
