import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

/**
 * These tests exercise routing, Zod request validation, and auth-guard
 * rejection paths that fail BEFORE any Prisma/database call is made — so
 * they don't require a live Postgres instance. Full happy-path flows
 * (signup → verify → login → refresh → logout against a real DB) are
 * covered by the acceptance criteria in IMPLEMENTATION_STATUS.md but need
 * a running database to execute; see AGENT_HANDOFF.md for status.
 */
describe("Phase 4 - Auth routes (validation & auth-guard paths, no DB required)", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    const app = createApp();
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(() => {
    server.close();
  });

  test("POST /api/v1/auth/signup with a malformed body returns 422 VALIDATION_ERROR", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short", fullName: "" }),
    });
    assert.equal(res.status, 422);
    const json = (await res.json()) as { error: { code: string; fields?: Record<string, string> } };
    assert.equal(json.error.code, "VALIDATION_ERROR");
    assert.ok(json.error.fields);
  });

  test("POST /api/v1/auth/signup rejects an invalid requestedRole", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "person@example.com",
        password: "a-long-enough-password",
        fullName: "Person Example",
        requestedRole: "admin", // not a valid self-declared requestedRole
      }),
    });
    assert.equal(res.status, 422);
  });

  test("POST /api/v1/auth/login with a malformed body returns 422", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assert.equal(res.status, 422);
  });

  test("POST /api/v1/auth/refresh with no refresh cookie returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, { method: "POST" });
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "UNAUTHENTICATED");
  });

  test("POST /api/v1/auth/logout with no Authorization header returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, { method: "POST" });
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "UNAUTHENTICATED");
  });

  test("POST /api/v1/auth/logout with a malformed Bearer token returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Authorization: "Bearer not-a-real-jwt" },
    });
    assert.equal(res.status, 401);
  });

  test("GET /api/v1/auth/me with no Authorization header returns 401 (HANDOFF-21)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, { method: "GET" });
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "UNAUTHENTICATED");
  });

  test("GET /api/v1/auth/me with a malformed Bearer token returns 401 (HANDOFF-21)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: "GET",
      headers: { Authorization: "Bearer not-a-real-jwt" },
    });
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string } };
    assert.equal(json.error.code, "UNAUTHENTICATED");
    // Never a body shaped like a partial/success user response on failure.
    assert.equal((json as unknown as { id?: string }).id, undefined);
  });

  test("POST /api/v1/auth/forgot-password with a malformed body returns 422", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assert.equal(res.status, 422);
  });

  test("POST /api/v1/auth/reset-password with a short newPassword returns 422", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "sometoken", newPassword: "short" }),
    });
    assert.equal(res.status, 422);
  });
});
