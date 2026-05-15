import path from "node:path";
import { mkdir } from "node:fs/promises";
import { getEnv } from "@/lib/env";

export function assertSafeStorageKey(storageKey: string) {
  const normalized = storageKey.replaceAll("\\", "/");

  if (normalized.startsWith("/") || normalized.includes("..") || /[\x00-\x1F\x7F]/.test(normalized)) {
    throw new Error("Invalid storage key");
  }

  return normalized;
}

export function getStorageRoot() {
  const env = getEnv();
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.STORAGE_PATH);
}

export function getStoragePath(storageKey: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const root = getStorageRoot();
  const absolutePath = path.normalize(path.join(root, safeKey));

  if (!absolutePath.startsWith(root)) {
    throw new Error("Invalid storage path");
  }

  return absolutePath;
}

export function getTmpDir() {
  return getStoragePath("tmp");
}

export function getBlobDir(hash: string) {
  return `blobs/${hash.slice(0, 2)}/${hash.slice(2, 4)}`;
}

export function getPrimaryBlobKey(hash: string, compressed: boolean) {
  return `${getBlobDir(hash)}/${hash}${compressed ? ".zst" : ".raw"}`;
}

export function getVariantKey(hash: string, suffix: string) {
  return `${getBlobDir(hash)}/${hash}.${suffix}`;
}

export async function ensureStorageDirs() {
  await mkdir(getStoragePath("blobs"), { recursive: true });
  await mkdir(getStoragePath("tmp"), { recursive: true });
}
