import { z } from "zod";

/**
 * Standard API error codes matching API_CONTRACT.md §0
 */
export const ErrorCodeEnum = z.enum([
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "ACCOUNT_SUSPENDED",
  "EMAIL_TAKEN",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_SERVER_ERROR",
  "BAD_REQUEST",
]);

export type ErrorCode = z.infer<typeof ErrorCodeEnum>;

/**
 * Canonical error response shape for all non-2xx responses (API_CONTRACT.md §0)
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Pagination query schema for all list endpoints
 */
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Generic paginated response factory
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
