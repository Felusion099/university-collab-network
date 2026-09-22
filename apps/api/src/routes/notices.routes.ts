import { Router } from "express";
import { z } from "zod";
import {
  CreateNoticeRequestSchema,
  UpdateNoticeRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/notice.controller.js";

const router = Router();

// Reads are public (notices are official campus information)
const NoticeListQuerySchema = PaginationQuerySchema.extend({});
router.get("/", validateQuery(NoticeListQuerySchema), controller.list);
router.get("/:id", controller.getById);

// Writes are admin-only — enforced server-side in the service
// (requestedRole + approved verification), never just here
router.post("/", requireAuth, validateBody(CreateNoticeRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdateNoticeRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);

export { router as noticesRouter };
