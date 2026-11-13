import express from "express";
import { config } from "./configuration/config.js";
import { logger } from "./logger.js";
import { authRouter } from "./routes/auth.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.APP_PORT, config.APP_HOST, (err) => {
  if (!err) {
    logger.info(`Server was started on port - ${config.APP_PORT}`);
  } else {
    logger.error(`Error while starting the server - ${err}`);
    process.exit(1);
  }
});
