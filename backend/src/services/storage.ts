import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export const uploadsRoot = path.resolve(process.cwd(), "uploads");

const imageExtensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return {
    uploadUrl,
    publicUrl: `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`
  };
}

export async function saveLocalProductImage({
  baseUrl,
  buffer,
  contentType,
  fileName,
  sellerId
}: {
  baseUrl: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  sellerId: string;
}) {
  const extension = imageExtensions[contentType];
  if (!extension) {
    throw new Error("Unsupported image type");
  }

  const safeName = path
    .parse(fileName)
    .name.replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "product";
  const relativeDir = path.join("products", sellerId);
  const uploadDir = path.join(uploadsRoot, relativeDir);
  const storedName = `${Date.now()}-${safeName}.${extension}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), buffer);

  return `${baseUrl}/uploads/${relativeDir.replaceAll(path.sep, "/")}/${storedName}`;
}
