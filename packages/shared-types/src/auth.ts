import { z } from "zod";

export const UserRoleEnum = z.enum([
  "student",
  "professor",
  "researcher",
  "professional",
  "club_rep",
  "startup_member",
  "alumni",
  "admin",
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const RequestedRoleEnum = z.enum([
  "student",
  "professor",
  "researcher",
  "professional",
  "club_rep",
  "startup_member",
  "alumni",
]);
export type RequestedRole = z.infer<typeof RequestedRoleEnum>;

export const UserStatusEnum = z.enum(["pending_verification", "active", "suspended", "banned"]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

// POST /auth/signup
export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  requestedRole: RequestedRoleEnum,
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  status: z.literal("pending_verification"),
});
export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// POST /auth/verify-email
export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const VerifyEmailResponseSchema = z.object({
  verified: z.boolean(),
  isUniversityVerified: z.boolean(),
});
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;

// POST /auth/login
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthenticatedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleEnum,
  status: UserStatusEnum,
});
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthenticatedUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// POST /auth/refresh
export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// POST /auth/forgot-password
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ForgotPasswordResponseSchema = z.object({
  sent: z.literal(true),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

// POST /auth/reset-password
export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordResponseSchema = z.object({
  reset: z.literal(true),
});
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
// ============================================================================
// OTP (one-time passcode) — passwordless signup/login
// ============================================================================

// POST /auth/otp/request
export const OtpRequestSchema = z.object({
  email: z.string().email(),
  // verify = an account created by password signup, pending_verification —
  // the emailed code VERIFIES the account and signs the user in
  purpose: z.enum(["signup", "login", "verify", "reset"]),
  fullName: z.string().max(120).optional(),
  requestedRole: RequestedRoleEnum.optional(),
});
export type OtpRequest = z.infer<typeof OtpRequestSchema>;

export const OtpRequestResponseSchema = z.object({
  sent: z.literal(true),
  expiresInMinutes: z.number(),
  // ONLY present when NODE_ENV !== production (dev testing convenience)
  devCode: z.string().optional(),
});
export type OtpRequestResponse = z.infer<typeof OtpRequestResponseSchema>;

// POST /auth/otp/verify
export const OtpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});
export type OtpVerify = z.infer<typeof OtpVerifySchema>;
// POST /auth/otp/reset — password reset via a one-time code
export const OtpResetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type OtpReset = z.infer<typeof OtpResetSchema>;
