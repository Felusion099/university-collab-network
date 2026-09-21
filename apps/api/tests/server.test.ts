import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

describe("Phase 3 - Server & Health Check", () => {
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

  test("GET /health responds with 200 and { status: 'ok' }", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const json = (await res.json()) as { status: string };
    assert.deepEqual(json, { status: "ok" });
  });

  test("GET /unknown-route returns 404 with canonical error shape", async () => {
    const res = await fetch(`${baseUrl}/api/v1/nonexistent-resource`);
    assert.equal(res.status, 404);
    const json = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(json.error.code, "NOT_FOUND");
    assert.ok(typeof json.error.message === "string");
  });
});
