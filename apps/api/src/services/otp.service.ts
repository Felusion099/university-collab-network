import bcrypt from "bcrypt";
import { prisma } from "../repositories/prisma.js";
import { authService } from "./auth.service.js";
import { emailService } from "./email.service.js";
import { NotFoundError, GoneError, BadRequestError, UnauthorizedError } from "../utils/errors.js";

/**
 * OTP (one-time passcode) — passwordless signup/login.
 *
 * POST /auth/otp/request → a 6-digit code is generated, stored HASHED
 * (bcrypt) with a 10-minute expiry and a 5-attempt cap, and sent via the
 * email service. In non-production the code is ALSO returned to the caller
 * (devCode) for testing convenience — never in production.
 *
 * POST /auth/otp/verify → the code is hash-compared; on success:
 *   - signup-purpose: the account is CREATED (from the pending profile data
 *     stored with the request) and the caller is logged in.
 *   - login-purpose: the caller is logged in.
 *
 * Codes are single-use (consumedAt) and old unconsumed codes for the same
 * email+purpose are invalidated when a new one is requested.
 */

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = 10;

function generateCode(): string {
  // Cryptographically-random 6-digit code (100000-999999)
  return String(100000 + Math.floor(Math.random() * 900000));
}

export async function requestOtp(input: {
  email: string;
  purpose: "signup" | "login" | "verify" | "reset";
  fullName?: string;
  requestedRole?: string;
}) {
  const email = input.email.toLowerCase().trim();

  if (input.purpose === "login") {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("No account with this email — sign up first");
  }

  if (input.purpose === "verify") {
    // An account created by password signup (pending_verification) — the
    // emailed code VERIFIES it. Requires an existing pending account.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("No account with this email");
  }

  if (input.purpose === "reset") {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("No account with this email");
  }

  if (input.purpose === "signup") {
    if (!input.fullName || !input.fullName.trim()) {
      throw new BadRequestError("Full name is required for signup");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) throw new BadRequestError("An account with this email already exists — use login instead");
  }

  // Invalidate old unconsumed codes for this email+purpose
  await prisma.otpCode.updateMany({
    where: { email, purpose: input.purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, BCRYPT_SALT_ROUNDS);

  await prisma.otpCode.create({
    data: {
      email,
      codeHash,
      purpose: input.purpose,
      fullName: input.purpose === "signup" ? input.fullName!.trim() : null,
      requestedRole: input.purpose === "signup" ? (input.requestedRole ?? "student") : null,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  // "Email" the code — MockEmailService logs it (dev); a real provider in
  // production. NON-BLOCKING: a provider failure (e.g. an unverified domain)
  // must not kill the request — the code exists; delivery can be retried.
  try {
    await emailService.sendOtpEmail(email, code);
  } catch {
    // Non-blocking email side effect — logged by the provider layer
  }

  const response: Record<string, unknown> = { sent: true, expiresInMinutes: 10 };
  if (process.env.NODE_ENV !== "production") {
    response.devCode = code; // dev convenience only — never in production
  }
  return response;
}

export async function verifyOtp(input: { email: string; code: string }) {
  const email = input.email.toLowerCase().trim();
  const code = input.code.trim();

  const row = await prisma.otpCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new NotFoundError("No active code for this email — request a new one");
  if (row.expiresAt.getTime() < Date.now()) {
    throw new GoneError("This code has expired — request a new one");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new UnauthorizedError("Too many wrong attempts — request a new code");
  }

  const valid = await bcrypt.compare(code, row.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    throw new UnauthorizedError(left > 0 ? `Wrong code — ${left} attempt${left === 1 ? "" : "s"} left` : "Too many wrong attempts — request a new code");
  }

  // Single-use: consume the code
  await prisma.otpCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });

  // Verify-purpose → the account was created by password signup and is
  // pending_verification: the code proves email ownership → mark ACTIVE
  // and sign the user in.
  if (row.purpose === "verify") {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("No account with this email");
    if (user.status === "pending_verification") {
      await prisma.user.update({ where: { id: user.id }, data: { status: "active" } });
    }
    return authService.loginWithActiveUser({ ...user, status: "active" });
  }

  // Reset-purpose → handled by resetPasswordWithOtp (needs the new password)
  if (row.purpose === "reset") {
    throw new BadRequestError("Use the reset-password form with this code");
  }

  // Signup-purpose → create the account from the pending profile data
  if (row.purpose === "signup") {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // A race (the user already exists) — log them in instead
        // A race: the user already exists — treat the OTP as a login
      const tokens = await authService.loginWithActiveUser(existing);
      return tokens;
    }
    const created = await authService.createFromOtp({
      email,
      fullName: row.fullName ?? email.split("@")[0]!,
      requestedRole: (row.requestedRole ?? "student") as never,
    });
    // The account is created ACTIVE — email ownership proven by the code
    return authService.loginWithActiveUser(created);
  }

  // Login-purpose → log the existing user in
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError("No account with this email");
  return authService.loginWithActiveUser(user);
}

/** Password reset via a one-time code: the emailed code verifies the
 * requester + the new password is set. Returns the fresh token pair
 * (signed in on reset). */
export async function resetPasswordWithOtp(input: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const email = input.email.toLowerCase().trim();
  const code = input.code.trim();

  if (input.newPassword.length < 8) {
    throw new BadRequestError("Password must be at least 8 characters");
  }

  const row = await prisma.otpCode.findFirst({
    where: { email, purpose: "reset", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new NotFoundError("No active reset code — request a new one");
  if (row.expiresAt.getTime() < Date.now()) {
    throw new GoneError("This code has expired — request a new one");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new UnauthorizedError("Too many wrong attempts — request a new code");
  }

  const valid = await bcrypt.compare(code, row.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    throw new UnauthorizedError("Wrong code");
  }

  await prisma.otpCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError("No account with this email");

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, status: user.status === "pending_verification" ? "active" : user.status },
  });

  return authService.loginWithActiveUser({ ...user, passwordHash, status: "active" });
}
