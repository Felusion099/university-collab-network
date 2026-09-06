/**
 * Cursor pagination helper, shared across all Phase 5 list endpoints per
 * API_CONTRACT.md §0 ("every list endpoint" uses `?cursor=&limit=` ->
 * `{ data, nextCursor }`). The cursor is an opaque base64-encoded offset —
 * simple and sufficient for MVP list sizes; swapping to a keyset cursor
 * later requires no controller/route changes since the shape is unchanged.
 */

export interface PageParams {
  skip: number;
  take: number;
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const n = Number(decoded);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export function toPageParams(cursor: string | undefined, limit: number): PageParams {
  return { skip: decodeCursor(cursor), take: limit };
}

export function buildPaginatedResponse<T>(
  items: T[],
  skip: number,
  take: number,
): { data: T[]; nextCursor: string | null } {
  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;
  return {
    data,
    nextCursor: hasMore ? encodeCursor(skip + take) : null,
  };
}
