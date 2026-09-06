import { Router } from "express";
import {
  UpdateNotificationPreferencesRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.patch("/:id/read", controller.markRead);
router.get("/preferences", controller.getPreferences);
router.patch(
  "/preferences",
  validateBody(UpdateNotificationPreferencesRequestSchema),
  controller.updatePreferences,
);

export { router as notificationsRouter };
