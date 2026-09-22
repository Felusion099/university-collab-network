import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { prisma } from "../src/repositories/prisma.js";

/**
 * Regression tests for PATCH /users/me/profile — the response must NEVER
 * contain passwordHash (it leaked via findById's raw user row before the
 * getOwnProfile-composition fix), and the avatarUrl (base64 data URI) must
 * persist alongside the other profile details.
 */
describe("Profile update — passwordHash never leaks + avatarUrl persists", () => {
  let server: Server;
  let baseUrl: string;
  let accessToken: string;

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

    const signup = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "avatar-leak-test@university.edu",
        password: "Password123!",
        fullName: "Avatar Leak Test",
        requestedRole: "student",
      }),
    });
    assert.equal(signup.status, 201);

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "avatar-leak-test@university.edu",
        password: "Password123!",
      }),
    });
    assert.equal(login.status, 200);
    accessToken = ((await login.json()) as { accessToken: string }).accessToken;
  });

  after(async () => {
    server.close();
    await prisma.refreshToken.deleteMany({
      where: { user: { email: "avatar-leak-test@university.edu" } },
    });
    await prisma.studentProfile.deleteMany({
      where: { user: { email: "avatar-leak-test@university.edu" } },
    });
    await prisma.privacySettings.deleteMany({
      where: { user: { email: "avatar-leak-test@university.edu" } },
    });
    await prisma.user.deleteMany({
      where: { email: "avatar-leak-test@university.edu" },
    });
  });

  test("PATCH /users/me/profile response contains no passwordHash field", async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ fullName: "Avatar Leak Test", bio: "updated bio" }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.ok(
      !("passwordHash" in body) && !("password_hash" in body),
      `PATCH /users/me/profile leaked a password hash field: ${Object.keys(body).join(", ")}`,
    );
  });

  test("avatarUrl (base64 data URI) persists and comes back on the profile", async () => {
    const dataUri =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPDIzM//wAALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmgA//9k=";

    const res = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ avatarUrl: dataUri }),
    });
    assert.equal(res.status, 200);
    const patchBody = (await res.json()) as { avatarUrl?: string };
    assert.equal(patchBody.avatarUrl, dataUri);

    const me = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(me.status, 200);
    const meBody = (await me.json()) as Record<string, unknown>;
    assert.equal(meBody.avatarUrl, dataUri);
    assert.ok(
      !("passwordHash" in meBody) && !("password_hash" in meBody),
      "GET /users/me must never return passwordHash",
    );
  });

  test("GET /users/me contains no passwordHash field", async () => {
    const me = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(me.status, 200);
    const body = (await me.json()) as Record<string, unknown>;
    assert.ok(
      !("passwordHash" in body) && !("password_hash" in body),
      `GET /users/me leaked a password hash field: ${Object.keys(body).join(", ")}`,
    );
  });
});
