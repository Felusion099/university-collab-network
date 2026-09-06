import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { prisma } from "../src/repositories/prisma.js";
import { authService } from "../src/services/auth.service.js";

describe("Phase 4 - Live DB Auth Lifecycle & Token Security", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    process.env.JWT_ACCESS_SECRET = "dev-access-secret-change-me";
    process.env.JWT_REFRESH_SECRET = "dev-refresh-secret-change-me";
    process.env.JWT_ACCESS_TTL = "15m";
    process.env.JWT_REFRESH_TTL = "7d";
    process.env.UNIVERSITY_EMAIL_DOMAINS = "university.edu";

    const app = createApp();
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    server.close();
    // Clean up test users created in this suite
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { contains: "authtest" } } },
    });
    await prisma.privacySettings.deleteMany({
      where: { user: { email: { contains: "authtest" } } },
    });
    await prisma.studentProfile.deleteMany({
      where: { user: { email: { contains: "authtest" } } },
    });
    await prisma.verification.deleteMany({
      where: { user: { email: { contains: "authtest" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: "authtest" } },
    });
  });

  const testEmail = `authtest_${Date.now()}@university.edu`;
  const testPassword = "SuperSecurePassword123!";
  let userId: string;
  let refreshCookie: string;
  let accessToken: string;

  test("1. POST /api/v1/auth/signup creates a pending user with username and profile", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: "Auth Test User",
        requestedRole: "student",
      }),
    });

    assert.equal(res.status, 201);
    const json = (await res.json()) as { userId: string; status: string };
    assert.ok(json.userId);
    assert.equal(json.status, "pending_verification");
    userId = json.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, privacySettings: true },
    });
    assert.ok(dbUser);
    assert.equal(dbUser.email, testEmail);
    assert.ok(dbUser.username);
    assert.equal(dbUser.requestedRole, "student");
    assert.equal(dbUser.status, "pending_verification");
    assert.equal(dbUser.studentProfile?.fullName, "Auth Test User");
    assert.ok(dbUser.privacySettings);
  });

  test("2. Duplicate signup returns 409 EMAIL_TAKEN", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: "Another Person",
        requestedRole: "student",
      }),
    });

    assert.equal(res.status, 409);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "EMAIL_TAKEN");
  });

  test("3. POST /api/v1/auth/verify-email activates user and marks isUniversityVerified", async () => {
    const verifyToken = authService.createEmailVerificationToken(userId);
    const res = await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verifyToken }),
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as { verified: boolean; isUniversityVerified: boolean };
    assert.equal(json.verified, true);
    assert.equal(json.isUniversityVerified, true);

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    assert.equal(dbUser?.status, "active");
    assert.equal(dbUser?.isUniversityVerified, true);
  });

  test("4. POST /api/v1/auth/login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999!",
      }),
    });

    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "INVALID_CREDENTIALS");
  });

  test("5. POST /api/v1/auth/login with valid credentials sets cookie and returns accessToken", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Response must include Set-Cookie header");
    assert.ok(setCookie.includes("refresh_token="), "Cookie must contain refresh_token");
    assert.ok(setCookie.includes("HttpOnly"), "Cookie must be HttpOnly");

    refreshCookie = setCookie.split(";")[0]!;

    const json = (await res.json()) as {
      accessToken: string;
      user: { id: string; email: string; role: string; status: string };
    };
    assert.ok(json.accessToken);
    assert.equal(json.user.id, userId);
    assert.equal(json.user.email, testEmail);
    assert.equal(json.user.status, "active");

    accessToken = json.accessToken;

    const dbTokens = await prisma.refreshToken.findMany({ where: { userId } });
    assert.ok(dbTokens.length > 0);
  });

  test("6. POST /api/v1/auth/refresh rotates refresh token and returns new accessToken", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshCookie,
      },
    });

    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Rotation must issue a new refresh token cookie");
    const newRefreshCookie = setCookie.split(";")[0]!;
    assert.notEqual(newRefreshCookie, refreshCookie, "Refresh token must rotate");

    refreshCookie = newRefreshCookie;

    const json = (await res.json()) as { accessToken: string };
    assert.ok(json.accessToken);
    accessToken = json.accessToken;
  });

  test("6b. GET /api/v1/auth/me returns the authenticated user with the just-refreshed token (HANDOFF-21)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      id: string;
      email: string;
      role: string;
      status: string;
      passwordHash?: string;
      password_hash?: string;
    };
    assert.equal(json.id, userId);
    assert.equal(json.email, testEmail);
    assert.equal(json.status, "active");
    // Same shape as POST /auth/login's `user` field (AuthenticatedUserSchema)
    assert.deepEqual(Object.keys(json).sort(), ["email", "id", "role", "status"]);
    // D-019's exact regression class: never a password hash in a user DTO.
    assert.equal(json.passwordHash, undefined);
    assert.equal(json.password_hash, undefined);
  });

  test("6c. GET /api/v1/auth/me with no token returns 401, not a cached/stale user", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, { method: "GET" });
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string }; id?: string };
    assert.equal(json.error.code, "UNAUTHENTICATED");
    assert.equal(json.id, undefined);
  });

  test("7. Malformed / expired access token returns 401 UNAUTHENTICATED on protected route", async () => {
    const resMalformed = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer invalid.jwt.token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bio: "Updated bio" }),
    });
    assert.equal(resMalformed.status, 401);

    const resNoAuth = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: "Updated bio" }),
    });
    assert.equal(resNoAuth.status, 401);
  });

  test("8. POST /api/v1/auth/forgot-password returns 200 sent:true regardless of email existence", async () => {
    const resExisting = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    assert.equal(resExisting.status, 200);
    const json1 = (await resExisting.json()) as { sent: boolean };
    assert.equal(json1.sent, true);

    const resNonExisting = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent_person_xyz@example.com" }),
    });
    assert.equal(resNonExisting.status, 200);
    const json2 = (await resNonExisting.json()) as { sent: boolean };
    assert.equal(json2.sent, true);
  });

  test("9. POST /api/v1/auth/reset-password resets password and enforces single-use token", async () => {
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const resetToken = authService.createPasswordResetToken(userId, dbUser.passwordHash);

    const newPassword = "BrandNewPassword456!";
    const resReset = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetToken,
        newPassword,
      }),
    });

    assert.equal(resReset.status, 200);
    const json = (await resReset.json()) as { reset: boolean };
    assert.equal(json.reset, true);

    // Replay attack with same reset token must fail (fingerprint no longer matches new password hash)
    const resReplay = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetToken,
        newPassword: "AnotherPassword789!",
      }),
    });
    assert.equal(resReplay.status, 401);

    // Old password fails to login
    const resOldLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert.equal(resOldLogin.status, 401);

    // New password succeeds
    const resNewLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    assert.equal(resNewLogin.status, 200);
    const newLoginJson = (await resNewLogin.json()) as { accessToken: string };
    accessToken = newLoginJson.accessToken;
    const setCookie = resNewLogin.headers.get("set-cookie");
    if (setCookie) refreshCookie = setCookie.split(";")[0]!;
  });

  test("10. POST /api/v1/auth/logout revokes refresh token and terminates session", async () => {
    const resLogout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: refreshCookie,
      },
    });
    assert.equal(resLogout.status, 204);

    // Subsequent refresh with revoked cookie returns 401
    const resRefreshAfterLogout = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshCookie,
      },
    });
    assert.equal(resRefreshAfterLogout.status, 401);
  });
});
