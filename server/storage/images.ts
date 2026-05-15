import { stat } from "node:fs/promises";
import sharp from "sharp";
import { getEnv } from "@/lib/env";

export function isOptimizableImage(mime: string | null | undefined) {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export async function optimizeImageWithSharp(inputPath: string, outputPath: string) {
  const env = getEnv();
  const result = await sharp(inputPath, { limitInputPixels: 48_000_000 })
    .timeout({ seconds: Math.max(1, Math.ceil(env.PROCESS_TIMEOUT_MS / 1000)) })
    .rotate()
    .resize({ width: env.IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: env.IMAGE_QUALITY })
    .toFile(outputPath);
  const file = await stat(outputPath);

  return {
    width: result.width,
    height: result.height,
    byteSize: BigInt(file.size),
    mimeType: "image/webp",
  };
}

export async function generateThumbnail(inputPath: string, outputPath: string) {
  const env = getEnv();
  const result = await sharp(inputPath, { limitInputPixels: 48_000_000 })
    .timeout({ seconds: Math.max(1, Math.ceil(env.PROCESS_TIMEOUT_MS / 1000)) })
    .rotate()
    .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(outputPath);
  const file = await stat(outputPath);

  return {
    width: result.width,
    height: result.height,
    byteSize: BigInt(file.size),
    mimeType: "image/webp",
  };
}
