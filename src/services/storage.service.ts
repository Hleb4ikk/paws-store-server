import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { config } from "../configuration/config.js";
import { logger } from "../logger.js";

let s3: S3Client | undefined;

const isConfigured =
  config.R2_ACCOUNT_ID &&
  config.R2_ACCESS_KEY_ID &&
  config.R2_SECRET_ACCESS_KEY &&
  config.R2_BUCKET_NAME;

if (isConfigured) {
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID!,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
    },
  });
} else {
  logger.warn("Cloudflare R2 is not configured — image uploads disabled");
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const isStorageConfigured = (): boolean => s3 !== undefined;

export const uploadProductImage = async (
  buffer: Buffer,
  mimeType: string,
): Promise<string> => {
  if (!s3) {
    throw new Error("Cloudflare R2 storage is not configured");
  }

  const extension = MIME_EXTENSIONS[mimeType];
  if (!extension) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const key = `products/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  const publicBase = config.R2_PUBLIC_URL?.replace(/\/$/, "");
  return publicBase
    ? `${publicBase}/${key}`
    : `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${config.R2_BUCKET_NAME}/${key}`;
};
