import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

describe("Phase 3 - Error Middleware & Canonical Error Shapes", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(() => {
    server.close();
  });

  test("GET /api/v1/test/error/not-found returns 404 with code NOT_FOUND", async () => {
    const res = await fetch(`${baseUrl}/api/v1/test/error/not-found`);
    assert.equal(res.status, 404);
    const json = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(json.error.code, "NOT_FOUND");
    assert.equal(json.error.message, "Sample resource not found");
  });

  test("GET /api/v1/test/error/unauthorized returns 401 with code UNAUTHENTICATED", async () => {
    const res = await fetch(`${baseUrl}/api/v1/test/error/unauthorized`);
    assert.equal(res.status, 401);
    const json = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(json.error.code, "UNAUTHENTICATED");
  });

  test("GET /api/v1/test/error/validation returns 422 with fields object", async () => {
    const res = await fetch(`${baseUrl}/api/v1/test/error/validation`);
    assert.equal(res.status, 422);
    const json = (await res.json()) as {
      error: { code: string; message: string; fields?: Record<string, string> };
    };
    assert.equal(json.error.code, "VALIDATION_ERROR");
    assert.ok(json.error.fields);
    assert.equal(json.error.fields.email, "Must be a valid university email address");
    assert.equal(json.error.fields.role, "Invalid role selected");
  });

  test("GET /api/v1/test/error/unhandled returns 500 INTERNAL_SERVER_ERROR without leaking raw error", async () => {
    const res = await fetch(`${baseUrl}/api/v1/test/error/unhandled`);
    assert.equal(res.status, 500);
    const json = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(json.error.code, "INTERNAL_SERVER_ERROR");
    assert.equal(json.error.message, "An internal server error occurred");
  });

  test("POST /api/v1/test/validate with invalid payload returns 422 with field-level issues", async () => {
    const res = await fetch(`${baseUrl}/api/v1/test/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a", email: "not-an-email" }),
    });

    assert.equal(res.status, 422);
    const json = (await res.json()) as {
      error: { code: string; message: string; fields?: Record<string, string> };
    };
    assert.equal(json.error.code, "VALIDATION_ERROR");
    assert.ok(json.error.fields);
    assert.ok(json.error.fields.name);
    assert.ok(json.error.fields.email);
  });
});
