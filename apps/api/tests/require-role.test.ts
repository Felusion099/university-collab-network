import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "../src/middleware/requireRole.js";
import { authRepository } from "../src/repositories/auth.repository.js";
import type { RequestUser } from "../src/middleware/requireAuth.js";

function fakeReq(user: RequestUser | undefined): Request {
  return { user } as unknown as Request;
}

function fakeRes(): Response {
  return {} as Response;
}

describe("Phase 4 - requireRole middleware (D-003 enforcement, mocked repository)", () => {
  test("rejects with 401 when req.user is missing (requireAuth didn't run first)", async () => {
    const middleware = requireRole(["professor"]);
    let capturedError: unknown;
    const next: NextFunction = (err) => {
      capturedError = err;
    };

    await middleware(fakeReq(undefined), fakeRes(), next);

    assert.ok(capturedError);
    assert.equal((capturedError as { statusCode: number }).statusCode, 401);
  });

  test("rejects with 403 when the user's role isn't in the allowed list", async () => {
    const middleware = requireRole(["professor"]);
    const user: RequestUser = {
      id: "u1",
      email: "a@b.com",
      requestedRole: "student",
      status: "active",
    };
    let capturedError: unknown;
    const next: NextFunction = (err) => {
      capturedError = err;
    };

    await middleware(fakeReq(user), fakeRes(), next);

    assert.ok(capturedError);
    assert.equal((capturedError as { statusCode: number }).statusCode, 403);
  });

  test("auto-granted roles (student, alumni) pass without a verifications lookup", async () => {
    const findApprovedMock = mock.method(authRepository, "findApprovedVerification", async () => {
      throw new Error("should not be called for auto-granted roles");
    });

    try {
      const middleware = requireRole(["student"]);
      const user: RequestUser = {
        id: "u2",
        email: "a@b.com",
        requestedRole: "student",
        status: "active",
      };
      let nextCalledCleanly = false;
      const next: NextFunction = (err) => {
        nextCalledCleanly = err === undefined;
      };

      await middleware(fakeReq(user), fakeRes(), next);

      assert.equal(nextCalledCleanly, true);
      assert.equal(findApprovedMock.mock.callCount(), 0);
    } finally {
      findApprovedMock.mock.restore();
    }
  });

  test("privileged role WITHOUT an approved verification is rejected with 403 (D-003)", async () => {
    const findApprovedMock = mock.method(
      authRepository,
      "findApprovedVerification",
      async () => null,
    );

    try {
      const middleware = requireRole(["professor"]);
      const user: RequestUser = {
        id: "u3",
        email: "prof@uni.edu",
        requestedRole: "professor",
        status: "active",
      };
      let capturedError: unknown;
      const next: NextFunction = (err) => {
        capturedError = err;
      };

      await middleware(fakeReq(user), fakeRes(), next);

      assert.ok(capturedError);
      assert.equal((capturedError as { statusCode: number }).statusCode, 403);
      assert.equal(findApprovedMock.mock.callCount(), 1);
    } finally {
      findApprovedMock.mock.restore();
    }
  });

  test("privileged role WITH an approved verification passes (D-003)", async () => {
    const findApprovedMock = mock.method(
      authRepository,
      "findApprovedVerification",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async () => ({ id: "v1", status: "approved" }) as any,
    );

    try {
      const middleware = requireRole(["professor"]);
      const user: RequestUser = {
        id: "u4",
        email: "prof2@uni.edu",
        requestedRole: "professor",
        status: "active",
      };
      let nextCalledCleanly = false;
      const next: NextFunction = (err) => {
        nextCalledCleanly = err === undefined;
      };

      await middleware(fakeReq(user), fakeRes(), next);

      assert.equal(nextCalledCleanly, true);
    } finally {
      findApprovedMock.mock.restore();
    }
  });
});
