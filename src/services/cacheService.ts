import { Redis } from "ioredis";
import { config } from "../configuration/config.js";
import { logger } from "../logger.js";

const CATALOG_KEY_PREFIX = "catalog:";

let redis: Redis | undefined;

if (config.REDIS_URL) {
  redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });
  redis.on("error", (err) => {
    logger.warn({ err }, "Redis connection error — caching disabled");
  });
  redis.connect().catch((err) => {
    logger.warn({ err }, "Redis unavailable — caching disabled");
  });
} else {
  logger.warn("REDIS_URL is not set — catalog caching disabled");
}

export const buildCatalogCacheKey = (queryString: string): string =>
  `${CATALOG_KEY_PREFIX}${queryString}`;

export const getCached = async (key: string): Promise<string | null> => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const setCached = async (key: string, value: string): Promise<void> => {
  if (!redis) return;
  try {
    await redis.set(key, value, "EX", config.CACHE_TTL_SECONDS);
  } catch {
    // cache write failures must not break the request
  }
};

export const invalidateCatalogCache = async (): Promise<void> => {
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        `${CATALOG_KEY_PREFIX}*`,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
    logger.info("Catalog cache invalidated");
  } catch (err) {
    logger.warn({ err }, "Failed to invalidate catalog cache");
  }
};

export const closeCache = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
  }
};
