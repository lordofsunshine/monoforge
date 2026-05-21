import { rm } from "node:fs/promises";
import { getPrisma } from "@/lib/prisma";
import { getStoragePath } from "@/server/storage/paths";

export function isOrphanBlobCandidate(blob: { refCount: number; files: Array<{ id: string }> }) {
  return blob.refCount <= 0 && blob.files.length === 0;
}

export async function runGarbageCollector(input: { limit?: number; dryRun?: boolean } = {}) {
  const prisma = getPrisma();
  const blobs = await prisma.fileBlob.findMany({
    where: {
      refCount: { lte: 0 },
      files: { none: {} },
    },
    include: {
      variants: true,
      files: { select: { id: true }, take: 1 },
    },
    take: input.limit || 500,
  });

  let deleted = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const blob of blobs) {
    if (!isOrphanBlobCandidate(blob)) {
      continue;
    }

    if (input.dryRun) {
      deleted += 1;
      continue;
    }

    try {
      await Promise.all([
        rm(getStoragePath(blob.storageKey), { force: true }),
        ...blob.variants.map((variant) => rm(getStoragePath(variant.storageKey), { force: true })),
      ]);
      await prisma.fileBlob.delete({ where: { id: blob.id } });
      deleted += 1;
    } catch (error) {
      errors.push({ id: blob.id, error: error instanceof Error ? error.message : "Delete failed" });
    }
  }

  return {
    scanned: blobs.length,
    deleted,
    errors,
  };
}
