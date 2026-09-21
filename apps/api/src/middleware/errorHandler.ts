import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { ErrorResponse } from "@app/shared-types";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // 0. body-parser SyntaxError (malformed/strict-rejected JSON payloads)
  // must be a 400, never a 500 — the payload was bad, not the server.
  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      error: { code: "BAD_REQUEST", message: "Invalid request payload" },
    });
    return;
  }

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    const errorBody: ErrorResponse["error"] = {
      code: err.code,
      message: err.message,
    };

    if (err.fields && Object.keys(err.fields).length > 0) {
      errorBody.fields = err.fields;
    }

    res.status(err.statusCode).json({ error: errorBody });
    return;
  }

  // 2. Zod validation errors
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "value";
      fields[path] = issue.message;
    }

    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        fields,
      },
    });
    return;
  }

  // 3. Unhandled internal server errors
  logger.error(err, "Unhandled error occurred during request processing");

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal server error occurred",
    },
  });
}
