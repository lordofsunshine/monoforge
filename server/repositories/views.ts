import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { rateLimitProfiles } from "@/lib/security/rate-limit";

function getMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function hashViewer(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function recordRepositoryView(repositoryId: string, viewerUserId?: string | null) {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore) || "local";
  const userAgent = headerStore.get("user-agent") || "unknown";

  const throttleKey = viewerUserId ? `view:user:${viewerUserId}` : `view:ip:${ip}`;
  const allowance = checkRateLimit(throttleKey, rateLimitProfiles.view.limit, rateLimitProfiles.view.windowMs);

  if (!allowance.allowed) {
    return;
  }

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
