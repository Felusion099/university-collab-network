import { Router } from "express";
import {
  SignupRequestSchema,
  VerifyEmailRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from "@app/shared-types";
import { validateBody } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", validateBody(SignupRequestSchema), authController.signup);
router.post("/verify-email", validateBody(VerifyEmailRequestSchema), authController.verifyEmail);
router.post("/login", validateBody(LoginRequestSchema), authController.login);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);
router.post(
  "/forgot-password",
  validateBody(ForgotPasswordRequestSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(ResetPasswordRequestSchema),
  authController.resetPassword,
);

export { router as authRouter };
