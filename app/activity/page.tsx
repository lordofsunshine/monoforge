import Link from "next/link";
import { ActivityFeed } from "@/components/repository/activity-feed";
import { RepoActivityStats } from "@/components/repository/repo-activity-stats";
import { RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export default async function GlobalActivityPage() {
  const prisma = getPrisma();
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  const [activity, repositories, issuesTouched, filesChanged, stars] = await Promise.all([
    prisma.repoActivity.findMany({
      where: { repository: { visibility: RepositoryVisibility.PUBLIC } },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    prisma.repository.count({ where: { visibility: RepositoryVisibility.PUBLIC } }),
    prisma.repoActivity.count({
      where: {
        repository: { visibility: RepositoryVisibility.PUBLIC },
        createdAt: { gte: monthStart },
        type: { in: ["ISSUE_OPENED", "ISSUE_CLOSED", "ISSUE_COMMENTED"] },
      },
    }),
    prisma.repoActivity.count({
      where: {
        repository: { visibility: RepositoryVisibility.PUBLIC },
        createdAt: { gte: monthStart },
        type: { in: ["FILE_UPLOADED", "FILE_UPDATED", "FILE_DELETED"] },
      },
    }),
    prisma.star.count({ where: { repository: { visibility: RepositoryVisibility.PUBLIC } } }),
  ]);

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">activity</p>
          <h1 className="mt-2 text-2xl font-semibold">Public activity</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Recent public changes, issues and stars across MonoForge.</p>
        </div>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-lineStrong hover:bg-subtle" href="/">
          Search projects
        </Link>
      </header>
      <RepoActivityStats monthlyUniqueViews={repositories} monthlyVisits={repositories} allTimeUniqueViews={repositories} filesChanged={filesChanged} issuesTouched={issuesTouched} stars={stars} />
      <ActivityFeed items={activity} titleKey="repo.activity" />
    </section>
  );
}
