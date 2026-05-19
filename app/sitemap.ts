import type { MetadataRoute } from "next";
import { RepositoryStatus, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const siteUrl = "https://monoforge.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const prisma = getPrisma();
  const [users, repositories, issues] = await Promise.all([
    prisma.user.findMany({
      where: {
        repositories: {
          some: {
            visibility: RepositoryVisibility.PUBLIC,
            status: RepositoryStatus.ACTIVE,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
      select: {
        username: true,
        updatedAt: true,
      },
    }),
    prisma.repository.findMany({
      where: {
        visibility: RepositoryVisibility.PUBLIC,
        status: RepositoryStatus.ACTIVE,
      },
      orderBy: { updatedAt: "desc" },
      take: 10000,
      select: {
        slug: true,
        updatedAt: true,
        owner: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.issue.findMany({
      where: {
        repository: {
          visibility: RepositoryVisibility.PUBLIC,
          status: RepositoryStatus.ACTIVE,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10000,
      select: {
        number: true,
        updatedAt: true,
        repository: {
          select: {
            slug: true,
            owner: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/rules`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...users.map((user) => ({
      url: `${siteUrl}/u/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...repositories.map((repository) => ({
      url: `${siteUrl}/${repository.owner.username}/${repository.slug}`,
      lastModified: repository.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...issues.map((issue) => ({
      url: `${siteUrl}/${issue.repository.owner.username}/${issue.repository.slug}/issues/${issue.number}`,
      lastModified: issue.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.45,
    })),
  ];
}
