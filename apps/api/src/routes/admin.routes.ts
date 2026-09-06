import { Router } from "express";
import {
  UpdateVerificationRequestSchema,
  UpdateReportRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import * as controller from "../controllers/admin.controller.js";

const router = Router();

// API_CONTRACT.md §9: requireRole(['admin']) on every route.
router.use(requireAuth, requireRole(["admin"]));

router.get("/verifications", validateQuery(PaginationQuerySchema), controller.listVerifications);
router.patch(
  "/verifications/:id",
  validateBody(UpdateVerificationRequestSchema),
  controller.updateVerification,
);
router.get("/reports", validateQuery(PaginationQuerySchema), controller.listReports);
router.patch("/reports/:id", validateBody(UpdateReportRequestSchema), controller.updateReport);
router.get("/metrics", controller.getMetrics);

export { router as adminRouter };
