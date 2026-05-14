import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/prisma";

function getMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function hashViewer(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function recordRepositoryView(repositoryId: string, viewerUserId?: string | null) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "local";
  const userAgent = headerStore.get("user-agent") || "unknown";
  const viewerHash = viewerUserId ? hashViewer(`user:${viewerUserId}`) : hashViewer(`anon:${ip}:${userAgent}`);
  const month = getMonthStart();

  await getPrisma().repoView.upsert({
    where: {
      repositoryId_viewerHash_month: {
        repositoryId,
        viewerHash,
        month,
      },
    },
    update: {
      viewCount: { increment: 1 },
      viewerUserId: viewerUserId || undefined,
    },
    create: {
      repositoryId,
      viewerHash,
      viewerUserId: viewerUserId || null,
      month,
    },
  });
}

export async function getRepositoryViewStats(repositoryId: string) {
  const month = getMonthStart();
  const prisma = getPrisma();
  const [monthlyUniqueViews, allTimeUniqueViews, monthlyVisits] = await Promise.all([
    prisma.repoView.count({
      where: {
        repositoryId,
        month,
      },
    }),
    prisma.repoView.count({
      where: { repositoryId },
    }),
    prisma.repoView.aggregate({
      where: {
        repositoryId,
        month,
      },
      _sum: {
        viewCount: true,
      },
    }),
  ]);

  return {
    monthlyUniqueViews,
    allTimeUniqueViews,
    monthlyVisits: monthlyVisits._sum.viewCount || 0,
  };
}
