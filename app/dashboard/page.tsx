import Link from "next/link";
import { ActivityFeed } from "@/components/repository/activity-feed";
import { QuotaBar } from "@/components/repository/quota-bar";
import { LocalizedText } from "@/components/system/localized-text";
import { requireUser } from "@/lib/auth/access";
import { getEnv } from "@/lib/env";
import { formatBytes } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { getUserStorageUsage } from "@/server/storage/limits";

export default async function DashboardPage() {
  const user = await requireUser();
  const prisma = getPrisma();
  const [repositories, starred, activity, storageQuota, userUsage] = await Promise.all([
    prisma.repository.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        visibility: true,
        starCount: true,
        issueCount: true,
        repoSize: true,
      },
    }),
    prisma.star.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        repository: {
          select: {
            name: true,
            slug: true,
            owner: { select: { username: true } },
          },
        },
      },
    }),
    prisma.repoActivity.findMany({
      where: { repository: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        actor: { select: { username: true } },
        repository: {
          select: {
            slug: true,
            owner: { select: { username: true } },
          },
        },
      },
    }),
    prisma.storageQuota.findUnique({
      where: { userId: user.id },
      select: { maxStorageBytes: true },
    }),
    getUserStorageUsage(user.id),
  ]);

  const env = getEnv();
  const quotaMax = storageQuota?.maxStorageBytes ?? BigInt(env.MAX_USER_STORAGE_MB) * 1024n * 1024n;

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
            <LocalizedText path="dashboard.eyebrow" />
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            <LocalizedText path="dashboard.title" />
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="mf-primary rounded-md border px-3 py-2 text-sm" href="/new">
            <LocalizedText path="dashboard.newRepo" />
          </Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-lineStrong hover:bg-subtle" href="/settings/profile">
            <LocalizedText path="dashboard.profile" />
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
              <LocalizedText path="dashboard.repositories" />
            </h2>
            <Link className="font-mono text-xs text-secondary hover:text-foreground" href="/new">
              <LocalizedText path="dashboard.create" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {repositories.length ? (
              repositories.map((repository) => (
                <Link
                  className="grid min-w-0 gap-2 border-b border-line px-4 py-4 last:border-b-0 hover:bg-subtle md:grid-cols-[minmax(0,1fr)_auto]"
                  href={`/${user.username}/${repository.slug}`}
                  key={repository.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{repository.name}</p>
                      <span className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] uppercase text-secondary">{repository.visibility.toLowerCase()}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-secondary">{repository.description || <LocalizedText path="common.noDescription" />}</p>
                  </div>
                  <div className="whitespace-nowrap font-mono text-xs text-faint">
                    {formatBytes(repository.repoSize)} · {repository.starCount} <LocalizedText path="common.stars" /> · {repository.issueCount} <LocalizedText path="common.issues" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-12 text-center text-sm text-secondary">
                <LocalizedText path="dashboard.noRepositories" />
              </div>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
                <LocalizedText path="dashboard.starred" />
              </h2>
              <Link className="font-mono text-xs text-secondary hover:text-foreground" href={`/u/${user.username}/stars`}>
                <LocalizedText path="dashboard.all" />
              </Link>
            </div>
            <div className="mt-3 grid gap-2">
              {starred.length ? (
                starred.map((star) => (
                  <Link className="truncate rounded-md border border-line px-3 py-2 text-sm hover:bg-subtle" href={`/${star.repository.owner.username}/${star.repository.slug}`} key={star.id}>
                    {star.repository.owner.username}/{star.repository.slug}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-secondary">
                  <LocalizedText path="dashboard.noStarred" />
                </p>
              )}
            </div>
          </section>
          <ActivityFeed items={activity} titleKey="dashboard.recentActivity" />
          <QuotaBar usedBytes={userUsage} maxBytes={quotaMax} />
        </aside>
      </div>
    </section>
  );
}
