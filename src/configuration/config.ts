import dotenv from "dotenv";

dotenv.config();

export const config = {
  APP_PORT: Number(process.env.APP_PORT ?? 3000),
  APP_HOST: String(process.env.APP_HOST ?? "0.0.0.0"),

  DATABASE_URL: String(process.env.DATABASE_URL),

  JWT_SECRET: String(process.env.JWT_SECRET ?? "change-me-in-production"),
  JWT_EXPIRES_IN: String(process.env.JWT_EXPIRES_IN ?? "7d"),

  REDIS_URL: process.env.REDIS_URL ? String(process.env.REDIS_URL) : undefined,
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS ?? 90),

  CORS_ORIGIN: String(process.env.CORS_ORIGIN ?? "*"),

  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID
    ? String(process.env.R2_ACCOUNT_ID)
    : undefined,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID
    ? String(process.env.R2_ACCESS_KEY_ID)
    : undefined,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
    ? String(process.env.R2_SECRET_ACCESS_KEY)
    : undefined,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME
    ? String(process.env.R2_BUCKET_NAME)
    : undefined,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL
    ? String(process.env.R2_PUBLIC_URL)
    : undefined,
};
