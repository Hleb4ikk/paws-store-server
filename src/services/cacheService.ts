import { redis } from "../redis.js";
import { config } from "../configuration/config.js";
import { logger } from "../logger.js";

const CATALOG_KEY_PREFIX = "catalog:";

export const buildCatalogCacheKey = (queryString: string): string =>
  `${CATALOG_KEY_PREFIX}${queryString}`;

export const getCached = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const setCached = async (key: string, value: string): Promise<void> => {
  try {
    await redis.set(key, value, "EX", config.CACHE_TTL_SECONDS);
  } catch {
    // cache write failures must not break the request
  }
};

export const invalidateCatalogCache = async (): Promise<void> => {
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
  await redis.quit();
};
