import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { PassThrough, type Readable, type Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { lookup } from "mime-types";
import { CompressionType, FileVariantKind, StorageBackend } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getRepoExtension } from "@/lib/repository/paths";
import { compressWithZstd, copyStoredFile, decompressWithZstd, shouldCompress, streamStoredFile } from "@/server/storage/compression";
import { generateThumbnail, isOptimizableImage, optimizeImageWithSharp } from "@/server/storage/images";
import { enforceQuota } from "@/server/storage/limits";
import { ensureStorageDirs, getPrimaryBlobKey, getStoragePath, getTmpDir, getVariantKey } from "@/server/storage/paths";

export type SavedBlob = {
  id: string;
  checksum: string;
  storageKey: string;
  originalSize: bigint;
  compressedSize: bigint;
  compressionType: CompressionType;
  mimeType: string;
  isBinary: boolean;
};

export async function calculateSha256Stream(file: string | Readable) {
  const hash = createHash("sha256");

  if (typeof file === "string") {
    await pipeline(createReadStream(file), hash);
  } else {
    await pipeline(file, hash);
  }

  return hash.digest("hex");
}

export function detectMimeType(fileName: string, fallback = "application/octet-stream") {
  return lookup(fileName) || fallback;
}

export async function writeUploadToTemp(input: Readable, userId: string, maxBytes: number) {
  await ensureStorageDirs();
  const tmpDir = getTmpDir();
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${userId}-${randomUUID()}.upload`);
  let byteSize = 0;
  const counter = new PassThrough();

  counter.on("data", (chunk: Buffer) => {
    byteSize += chunk.length;

    if (byteSize > maxBytes) {
      counter.destroy(new Error("Upload is over the configured limit"));
    }
  });

  try {
    await pipeline(input, counter, createWriteStream(tmpPath));
  } catch (error) {
    await rm(tmpPath, { force: true });
    throw error;
  }

  return {
    tmpPath,
    byteSize,
  };
}

export function isProbablyBinaryByName(mimeType: string, extension: string | null) {
  if (mimeType.startsWith("text/")) {
    return false;
  }

  const textExtensions = new Set(["md", "mdx", "json", "js", "jsx", "ts", "tsx", "css", "scss", "html", "txt", "yaml", "yml", "xml", "csv", "toml", "sql", "prisma"]);
  return extension ? !textExtensions.has(extension) : !["application/json", "application/xml"].includes(mimeType);
}

export async function saveBlob(input: {
  tmpPath: string;
  originalName: string;
  userId: string;
  byteSize: number;
}) {
  await enforceQuota(input.userId, input.byteSize);

  const prisma = getPrisma();
  const checksum = await calculateSha256Stream(input.tmpPath);
  const existing = await prisma.fileBlob.findUnique({
    where: { checksum },
    include: { variants: true },
  });

  if (existing) {
    await rm(input.tmpPath, { force: true });
    return {
      id: existing.id,
      checksum: existing.checksum,
      storageKey: existing.storageKey,
      originalSize: existing.originalSize,
      compressedSize: existing.compressedSize || existing.originalSize,
      compressionType: existing.compressionType,
      mimeType: existing.mimeType || "application/octet-stream",
      isBinary: isProbablyBinaryByName(existing.mimeType || "application/octet-stream", getRepoExtension(input.originalName)),
    } satisfies SavedBlob;
  }

  const extension = getRepoExtension(input.originalName);
  const mimeType = detectMimeType(input.originalName);
  const compress = shouldCompress(mimeType, extension);
  const primaryKey = getPrimaryBlobKey(checksum, compress);
  const primaryPath = getStoragePath(primaryKey);
  await mkdir(path.dirname(primaryPath), { recursive: true });

  let compressionType: CompressionType = CompressionType.NONE;
  let compressedSize = BigInt(input.byteSize);

  if (compress) {
    try {
      await compressWithZstd(input.tmpPath, primaryPath);
      compressionType = CompressionType.ZSTD;
      compressedSize = BigInt((await stat(primaryPath)).size);
    } catch {
      const rawKey = getPrimaryBlobKey(checksum, false);
      const rawPath = getStoragePath(rawKey);
      await copyStoredFile(input.tmpPath, rawPath);
      await rm(primaryPath, { force: true });
      const blob = await createBlobRecord({
        checksum,
        storageKey: rawKey,
        originalSize: BigInt(input.byteSize),
        compressedSize: BigInt(input.byteSize),
        compressionType: CompressionType.NONE,
        mimeType,
      });
      await createImageVariantsIfNeeded(blob.id, checksum, input.tmpPath, mimeType).catch(() => undefined);
      await rm(input.tmpPath, { force: true });
      return toSavedBlob(blob, extension);
    }
  } else {
    await rename(input.tmpPath, primaryPath).catch(async () => {
      await copyStoredFile(input.tmpPath, primaryPath);
      await rm(input.tmpPath, { force: true });
    });
  }

  const blob = await createBlobRecord({
    checksum,
    storageKey: primaryKey,
    originalSize: BigInt(input.byteSize),
    compressedSize,
    compressionType,
    mimeType,
  });

  await createImageVariantsIfNeeded(blob.id, checksum, primaryPath, mimeType).catch(() => undefined);
  await rm(input.tmpPath, { force: true });
  return toSavedBlob(blob, extension);
}

async function createBlobRecord(input: {
  checksum: string;
  storageKey: string;
  originalSize: bigint;
  compressedSize: bigint;
  compressionType: CompressionType;
  mimeType: string;
}) {
  return getPrisma().fileBlob.create({
    data: {
      checksum: input.checksum,
      storageKey: input.storageKey,
      originalSize: input.originalSize,
      compressedSize: input.compressedSize,
      compressionType: input.compressionType,
      storageBackend: StorageBackend.LOCAL,
      mimeType: input.mimeType,
      refCount: 0,
    },
  });
}

function toSavedBlob(blob: {
  id: string;
  checksum: string;
  storageKey: string;
  originalSize: bigint;
  compressedSize: bigint | null;
  compressionType: CompressionType;
  mimeType: string | null;
}, extension: string | null): SavedBlob {
  return {
    id: blob.id,
    checksum: blob.checksum,
    storageKey: blob.storageKey,
    originalSize: blob.originalSize,
    compressedSize: blob.compressedSize || blob.originalSize,
    compressionType: blob.compressionType,
    mimeType: blob.mimeType || "application/octet-stream",
    isBinary: isProbablyBinaryByName(blob.mimeType || "application/octet-stream", extension),
  };
}

async function createImageVariantsIfNeeded(blobId: string, checksum: string, inputPath: string, mimeType: string) {
  if (!isOptimizableImage(mimeType)) {
    return;
  }

  const previewKey = getVariantKey(checksum, "preview.webp");
  const thumbKey = getVariantKey(checksum, "thumb.webp");
  const previewPath = getStoragePath(previewKey);
  const thumbPath = getStoragePath(thumbKey);
  await mkdir(path.dirname(previewPath), { recursive: true });

  const preview = await optimizeImageWithSharp(inputPath, previewPath);
  const thumbnail = await generateThumbnail(inputPath, thumbPath);

  await getPrisma().fileVariant.createMany({
    data: [
      {
        blobId,
        kind: FileVariantKind.IMAGE_PREVIEW,
        storageKey: previewKey,
        mimeType: preview.mimeType,
        byteSize: preview.byteSize,
        width: preview.width,
        height: preview.height,
      },
      {
        blobId,
        kind: FileVariantKind.IMAGE_THUMBNAIL,
        storageKey: thumbKey,
        mimeType: thumbnail.mimeType,
        byteSize: thumbnail.byteSize,
        width: thumbnail.width,
        height: thumbnail.height,
      },
    ],
    skipDuplicates: true,
  });
}

export async function getBlobByHash(hash: string) {
  return getPrisma().fileBlob.findUnique({
    where: { checksum: hash },
    include: { variants: true },
  });
}

export async function deleteBlobIfUnused(hash: string) {
  const prisma = getPrisma();
  const blob = await prisma.fileBlob.findUnique({
    where: { checksum: hash },
    include: {
      files: { select: { id: true }, take: 1 },
      variants: true,
    },
  });

  if (!blob || blob.files.length > 0 || blob.refCount > 0) {
    return false;
  }

  await Promise.all([
    rm(getStoragePath(blob.storageKey), { force: true }),
    ...blob.variants.map((variant) => rm(getStoragePath(variant.storageKey), { force: true })),
  ]);

  await prisma.fileBlob.delete({ where: { id: blob.id } });
  return true;
}

function readableSizeLimit(value?: bigint | number | null) {
  if (typeof value === "bigint") {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : undefined;
  }

  return typeof value === "number" ? value : undefined;
}

export async function streamBlobToOutput(blob: { storageKey: string; compressionType: CompressionType; originalSize?: bigint | number | null }, outputStream: Writable) {
  const inputPath = getStoragePath(blob.storageKey);

  if (blob.compressionType === CompressionType.ZSTD) {
    await decompressWithZstd(inputPath, outputStream, readableSizeLimit(blob.originalSize));
    return;
  }

  await streamStoredFile(inputPath, outputStream);
}
