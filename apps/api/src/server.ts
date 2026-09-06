import dotenv from "dotenv";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(
    `[api] Backend Core server listening on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
  );
});

export { app, server };
