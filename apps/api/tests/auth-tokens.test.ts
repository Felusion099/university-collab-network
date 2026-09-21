import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  verifyAccessToken,
  hashOpaqueToken,
} from "../src/services/auth.service.js";

describe("Phase 4 - Auth token/password helpers (pure, no DB)", () => {
  before(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.JWT_ACCESS_TTL = "15m";
    process.env.JWT_REFRESH_TTL = "7d";
  });

  test("hashPassword produces a bcrypt hash distinct from the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.notEqual(hash, "correct horse battery staple");
    assert.match(hash, /^\$2[aby]\$/);
  });

  test("comparePassword accepts the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cur3-p@ssword");
    assert.equal(await comparePassword("s3cur3-p@ssword", hash), true);
    assert.equal(await comparePassword("wrong-password", hash), false);
  });

  test("signAccessToken / verifyAccessToken round-trip the user id", () => {
    const token = signAccessToken({ id: "11111111-1111-1111-1111-111111111111" });
    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, "11111111-1111-1111-1111-111111111111");
    assert.equal(payload.purpose, "access");
  });

  test("verifyAccessToken rejects a token signed with a different secret", () => {
    const token = signAccessToken({ id: "22222222-2222-2222-2222-222222222222" });
    const originalSecret = process.env.JWT_ACCESS_SECRET;
    process.env.JWT_ACCESS_SECRET = "a-completely-different-secret";
    assert.throws(() => verifyAccessToken(token));
    process.env.JWT_ACCESS_SECRET = originalSecret;
  });

  test("hashOpaqueToken is deterministic and does not return the input unchanged", () => {
    const raw = "some-refresh-token-string";
    const first = hashOpaqueToken(raw);
    const second = hashOpaqueToken(raw);
    assert.equal(first, second);
    assert.notEqual(first, raw);
    assert.equal(first.length, 64); // sha256 hex digest
  });
});
