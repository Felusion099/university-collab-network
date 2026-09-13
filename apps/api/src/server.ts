import dotenv from "dotenv";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

dotenv.config();

// Express 4 does not catch errors thrown from async middleware — a rejected
// promise there would kill the process (Node exits on unhandled
// rejections). All async middleware in this codebase routes errors through
// next(); this logger is defense-in-depth so a future gap surfaces in the
// logs instead of taking the API down.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "[api] Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "[api] Uncaught exception");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(
    `[api] Backend Core server listening on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
  );
});

export { app, server };
