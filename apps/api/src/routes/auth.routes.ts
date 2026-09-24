import { Router } from "express";
import {
  OtpRequestSchema,
  OtpVerifySchema,
  OtpResetSchema,
  SignupRequestSchema,
  VerifyEmailRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from "@app/shared-types";
import { validateBody } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as authController from "../controllers/auth.controller.js";
import * as otpController from "../controllers/otp.controller.js";

const router = Router();

router.post("/signup", validateBody(SignupRequestSchema), authController.signup);
router.post("/verify-email", validateBody(VerifyEmailRequestSchema), authController.verifyEmail);
router.post("/login", validateBody(LoginRequestSchema), authController.login);
// OTP (one-time passcode) — passwordless signup/login
router.post("/otp/request", validateBody(OtpRequestSchema), otpController.requestOtp);
router.post("/otp/verify", validateBody(OtpVerifySchema), otpController.verifyOtp);
router.post("/otp/reset", validateBody(OtpResetSchema), otpController.resetPassword);
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
