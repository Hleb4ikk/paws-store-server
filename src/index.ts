import express from "express";
import cors from "cors";
import { config } from "./configuration/config.js";
import { logger } from "./logger.js";
import { authRouter } from "./routes/auth.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = config.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim(),
);
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);

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
