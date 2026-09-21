import { Router } from "express";
import { z } from "zod";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/errors.js";
import { validateBody } from "../validators/validate.js";

const router = Router();

// Test deliberate errors for verifying acceptance criteria
router.get("/error/not-found", () => {
  throw new NotFoundError("Sample resource not found");
});

router.get("/error/unauthorized", () => {
  throw new UnauthorizedError("Sample authentication required");
});

router.get("/error/validation", () => {
  throw new ValidationError("Invalid fields provided", {
    email: "Must be a valid university email address",
    role: "Invalid role selected",
  });
});

router.get("/error/bad-request", () => {
  throw new BadRequestError("Invalid query parameters supplied");
});

router.get("/error/unhandled", () => {
  throw new Error("Unexpected database connection failure simulation");
});

const sampleValidationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
});

router.post("/validate", validateBody(sampleValidationSchema), (req, res) => {
  res.status(200).json({ success: true, data: req.body });
});

export { router as testRouter };
