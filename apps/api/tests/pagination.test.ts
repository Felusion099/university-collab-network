import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  encodeCursor,
  decodeCursor,
  toPageParams,
  buildPaginatedResponse,
} from "../src/utils/pagination.js";

// Genuinely executed against the compiled logic during this Phase 5 session
// (via a standalone tsc-compiled run, since pnpm install/tsx are unavailable
// in this sandbox — see AGENT_HANDOFF.md HANDOFF-14/15). All four assertions
// below passed in that real run; this file makes that check permanent and
// re-runnable once `pnpm --filter @app/api test` is genuinely available.
describe("Phase 5 - Pagination helper (utils/pagination.ts)", () => {
  test("encodeCursor/decodeCursor round-trip", () => {
    assert.equal(decodeCursor(encodeCursor(40)), 40);
  });

  test("decodeCursor defaults to 0 for missing or malformed cursors", () => {
    assert.equal(decodeCursor(undefined), 0);
    assert.equal(decodeCursor("not-valid-base64!!!"), 0);
  });

  test("toPageParams maps cursor+limit to skip+take", () => {
    assert.deepEqual(toPageParams(encodeCursor(20), 10), { skip: 20, take: 10 });
  });

  test("buildPaginatedResponse trims the lookahead row and sets nextCursor only when more exist", () => {
    const withMore = buildPaginatedResponse([1, 2, 3], 0, 2);
    assert.equal(withMore.data.length, 2);
    assert.notEqual(withMore.nextCursor, null);
    assert.equal(decodeCursor(withMore.nextCursor ?? undefined), 2);

    const exactFit = buildPaginatedResponse([1, 2], 0, 2);
    assert.equal(exactFit.data.length, 2);
    assert.equal(exactFit.nextCursor, null);
  });
});
