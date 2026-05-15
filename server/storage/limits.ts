import { getEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/security/audit-log";

let activeUploads = 0;

export async function acquireUploadSlot() {
  const env = getEnv();

  if (activeUploads >= env.MAX_CONCURRENT_UPLOADS) {
    throw new Error("Too many concurrent uploads");
  }

  activeUploads += 1;

  return () => {
    activeUploads = Math.max(0, activeUploads - 1);
  };
}

export async function getUserStorageUsage(userId: string) {
  const prisma = getPrisma();
  const aggregate = await prisma.repository.aggregate({
    where: { ownerId: userId },
    _sum: { repoSize: true },
  });

  return aggregate._sum.repoSize || 0n;
}

export async function enforceQuota(userId: string, incomingFileSize: number) {
  const env = getEnv();

  if (incomingFileSize > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    await writeAuditLog({
      actorId: userId,
      action: "UPLOAD_LARGE_FILE",
      metadata: { incomingFileSize, maxUploadMb: env.MAX_UPLOAD_SIZE_MB },
    }).catch(() => undefined);
    throw new Error(`File is over ${env.MAX_UPLOAD_SIZE_MB} MB`);
  }

  const used = await getUserStorageUsage(userId);
  const maxUserBytes = BigInt(env.MAX_USER_STORAGE_MB) * 1024n * 1024n;

  if (used + BigInt(incomingFileSize) > maxUserBytes) {
    await writeAuditLog({
      actorId: userId,
      action: "QUOTA_EXCEEDED",
      metadata: { used: used.toString(), incomingFileSize, maxUserBytes: maxUserBytes.toString() },
    }).catch(() => undefined);
    throw new Error("User storage quota exceeded");
  }
}
