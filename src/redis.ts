import { Redis } from "ioredis";
import { config } from "./configuration/config.js";
import { logger } from "./logger.js";

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", (err) => {
  logger.warn({ err }, "Redis connection error");
});

redis.connect().catch((err) => {
  logger.warn({ err }, "Redis unavailable");
});
