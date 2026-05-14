import { IssueStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export type RepoMetrics = {
  fileCount: number;
  repoSize: bigint;
  logicalOriginalSize: bigint;
  compressedSize: bigint;
  compressionSavedBytes: bigint;
  compressionSavedPercent: number;
  lastUpdate: Date;
  openIssues: number;
  closedIssues: number;
  stars: number;
  hasReadme: boolean;
  largeFileCount: number;
  disciplineScore: number;
};

export type ActivityPulseDay = {
  day: string;
  count: number;
};

function getSavedPercent(originalSize: bigint, compressedSize: bigint) {
  if (originalSize <= 0n || compressedSize >= originalSize) {
    return 0;
  }

  return Math.round((Number(originalSize - compressedSize) / Number(originalSize)) * 100);
}

export function calculateStorageDisciplineScore(input: {
  fileCount: number;
  compressionSavedPercent: number;
  hasReadme: boolean;
  largeFileCount: number;
  openIssues: number;
  closedIssues: number;
}) {
  let score = 0;

  if (input.hasReadme) score += 20;
  if (input.compressionSavedPercent >= 30) score += 25;
  else if (input.compressionSavedPercent >= 10) score += 15;
  if (input.largeFileCount === 0) score += 20;
  else if (input.largeFileCount <= 2) score += 10;
  if (input.fileCount <= 500) score += 15;
  else if (input.fileCount <= 800) score += 8;

  const totalIssues = input.openIssues + input.closedIssues;
  if (totalIssues === 0) {
    score += 20;
  } else {
    score += Math.round((input.closedIssues / totalIssues) * 20);
  }

  return Math.max(0, Math.min(100, score));
}

export async function getRepoMetrics(repositoryId: string): Promise<RepoMetrics> {
  const prisma = getPrisma();
  const [repository, files, openIssues, closedIssues] = await Promise.all([
    prisma.repository.findUniqueOrThrow({
      where: { id: repositoryId },
      select: {
        fileCount: true,
        repoSize: true,
        starCount: true,
        updatedAt: true,
        readmePath: true,
      },
    }),
    prisma.repositoryFile.findMany({
      where: {
        repositoryId,
        kind: "FILE",
      },
      select: {
        size: true,
        blobId: true,
        blob: {
          select: {
            originalSize: true,
            compressedSize: true,
          },
        },
      },
      take: 1000,
    }),
    prisma.issue.count({
      where: { repositoryId, status: IssueStatus.OPEN },
    }),
    prisma.issue.count({
      where: { repositoryId, status: IssueStatus.CLOSED },
    }),
  ]);

  const seenBlobIds = new Set<string>();
  let logicalOriginalSize = 0n;
  let compressedSize = 0n;
  let largeFileCount = 0;

  for (const file of files) {
    logicalOriginalSize += BigInt(file.size);
    if (BigInt(file.size) >= 5n * 1024n * 1024n) {
      largeFileCount += 1;
    }

    if (file.blobId && file.blob && !seenBlobIds.has(file.blobId)) {
      seenBlobIds.add(file.blobId);
      compressedSize += file.blob.compressedSize ?? file.blob.originalSize;
    }
  }

  const compressionSavedBytes = logicalOriginalSize > compressedSize ? logicalOriginalSize - compressedSize : 0n;
  const compressionSavedPercent = getSavedPercent(logicalOriginalSize, compressedSize);

  return {
    fileCount: repository.fileCount,
    repoSize: repository.repoSize,
    logicalOriginalSize,
    compressedSize,
    compressionSavedBytes,
    compressionSavedPercent,
    lastUpdate: repository.updatedAt,
    openIssues,
    closedIssues,
    stars: repository.starCount,
    hasReadme: Boolean(repository.readmePath),
    largeFileCount,
    disciplineScore: calculateStorageDisciplineScore({
      fileCount: repository.fileCount,
      compressionSavedPercent,
      hasReadme: Boolean(repository.readmePath),
      largeFileCount,
      openIssues,
      closedIssues,
    }),
  };
}

export async function getActivityPulse(repositoryId: string, days = 21): Promise<ActivityPulseDay[]> {
  const prisma = getPrisma();
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const activity = await prisma.repoActivity.findMany({
    where: {
      repositoryId,
      createdAt: { gte: start },
    },
    select: { createdAt: true },
    take: 500,
  });

  const counts = new Map<string, number>();

  for (const item of activity) {
    const key = item.createdAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const day = date.toISOString().slice(0, 10);
    return { day, count: counts.get(day) ?? 0 };
  });
}
