import { getPrisma } from "@/lib/prisma";
import { getUserStorageUsage } from "@/server/storage/limits";

export async function getStorageStats(userId?: string) {
  const prisma = getPrisma();
  const [blobStats, variantStats, userUsage] = await Promise.all([
    prisma.fileBlob.aggregate({
      _count: { id: true },
      _sum: {
        originalSize: true,
        compressedSize: true,
      },
    }),
    prisma.fileVariant.aggregate({
      _count: { id: true },
      _sum: {
        byteSize: true,
      },
    }),
    userId ? getUserStorageUsage(userId) : Promise.resolve(null),
  ]);

  return {
    blobs: blobStats._count.id,
    variants: variantStats._count.id,
    originalBytes: blobStats._sum.originalSize || 0n,
    storedBlobBytes: blobStats._sum.compressedSize || 0n,
    variantBytes: variantStats._sum.byteSize || 0n,
    userUsageBytes: userUsage,
  };
}
