import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import type { IncomingMessage } from "node:http";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { NotFoundError } from "./utils/errors.js";
import { apiV1Router, healthRouter } from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  // 1. Logging middleware
  if (process.env.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        // The SSE stream URL carries ?token=<accessToken> — never log it
        // in plain text. Every logged URL has its query string stripped.
        serializers: {
          req: (req) => ({
            type: "request",
            method: req.method,
            url: req.url?.split("?")[0],
          }),
        },
        autoLogging: {
          ignore: (req: IncomingMessage) => req.url === "/health",
        },
      }),
    );
  }

  // 2. CORS configuration
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          callback(null, true);
        } else if (origin.endsWith(".vercel.app")) {
          // Vercel preview + production subdomains — every deployment URL
          // (preview hashes differ per deploy; the exact list can't cover them)
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    }),
  );

  // 3. Body parsing middleware
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 4. Health check endpoint (top-level)
  app.use(healthRouter);

  // 5. Versioned API routes
  app.use("/api/v1", apiV1Router);

  // 6. 404 Fallback for unmatched routes
  app.use((_req, _res, next) => {
    next(new NotFoundError("The requested endpoint was not found"));
  });

  // 7. Central Error Handling Middleware (must be last)
  app.use(errorHandler);

  return app;
}
