import { z } from "zod";

export const UserRoleEnum = z.enum([
  "student",
  "professor",
  "researcher",
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
