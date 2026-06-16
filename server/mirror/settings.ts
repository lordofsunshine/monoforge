import { MirrorStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

const settingsId = "default";

export async function getMirrorSettings() {
  const prisma = getPrisma();
  return prisma.mirrorSettings.upsert({
    where: { id: settingsId },
    update: {},
    create: { id: settingsId },
  });
}

export async function setMirrorEnabled(enabled: boolean) {
  const prisma = getPrisma();
  return prisma.mirrorSettings.upsert({
    where: { id: settingsId },
    update: { enabled },
    create: { id: settingsId, enabled },
  });
}

export async function advanceCursor(toGithubId: number) {
  const prisma = getPrisma();
  const current = await getMirrorSettings();
  const next = BigInt(toGithubId);

  if (next <= current.cursor) {
    return current.cursor;
  }

  await prisma.mirrorSettings.update({
    where: { id: settingsId },
    data: { cursor: next },
  });

  return next;
}

export async function markRun(error: string | null) {
  const prisma = getPrisma();
  await prisma.mirrorSettings.update({
    where: { id: settingsId },
    data: { lastRunAt: new Date(), lastError: error },
  });
}

export async function hasMirrored(githubId: number) {
  const prisma = getPrisma();
  const existing = await prisma.mirroredRepository.findUnique({
    where: { githubId: BigInt(githubId) },
    select: { id: true },
  });

  return Boolean(existing);
}

export type RecordResultInput = {
  githubId: number;
  fullName: string;
  ownerLogin: string;
  repoName: string;
  license: string | null;
  status: MirrorStatus;
  reason?: string | null;
  monoforgeUserId?: string | null;
  monoforgeRepositoryId?: string | null;
  fileCount?: number;
  byteSize?: number | bigint;
};

export async function recordResult(input: RecordResultInput) {
  const prisma = getPrisma();
  const githubId = BigInt(input.githubId);
  const byteSize = typeof input.byteSize === "bigint" ? input.byteSize : BigInt(input.byteSize || 0);
  const counterField =
    input.status === MirrorStatus.IMPORTED ? "importedCount" : input.status === MirrorStatus.SKIPPED ? "skippedCount" : "failedCount";

  await prisma.$transaction([
    prisma.mirroredRepository.upsert({
      where: { githubId },
      update: {
        status: input.status,
        reason: input.reason ?? null,
        license: input.license,
        monoforgeUserId: input.monoforgeUserId ?? null,
        monoforgeRepositoryId: input.monoforgeRepositoryId ?? null,
        fileCount: input.fileCount ?? 0,
        byteSize,
        attemptCount: { increment: 1 },
      },
      create: {
        githubId,
        fullName: input.fullName,
        ownerLogin: input.ownerLogin,
        repoName: input.repoName,
        license: input.license,
        status: input.status,
        reason: input.reason ?? null,
        monoforgeUserId: input.monoforgeUserId ?? null,
        monoforgeRepositoryId: input.monoforgeRepositoryId ?? null,
        fileCount: input.fileCount ?? 0,
        byteSize,
        attemptCount: 1,
      },
    }),
    prisma.mirrorSettings.update({
      where: { id: settingsId },
      data: { [counterField]: { increment: 1 } },
    }),
  ]);
}
