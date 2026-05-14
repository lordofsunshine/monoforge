import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ActivityFeed } from "@/components/repository/activity-feed";
import { RepoActivityStats } from "@/components/repository/repo-activity-stats";
import { LocalizedText } from "@/components/system/localized-text";
import { getPrisma } from "@/lib/prisma";
import { ensureRepoReadable } from "@/server/repositories/files";
import { getRepositoryViewStats } from "@/server/repositories/views";

type ActivityPageProps = {
  params: Promise<{ owner: string; repo: string }>;
};

export default async function RepositoryActivityPage({ params }: ActivityPageProps) {
  const { owner, repo } = await params;
  const session = await auth();
  const repository = await ensureRepoReadable(owner.toLowerCase(), repo.toLowerCase(), session?.user?.id).catch(() => null);

  if (!repository) {
    notFound();
  }

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);
  const prisma = getPrisma();
  const [activity, viewStats, filesChanged, issuesTouched] = await Promise.all([
    prisma.repoActivity.findMany({
      where: { repositoryId: repository.id },
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
    getRepositoryViewStats(repository.id),
    prisma.repoActivity.count({
      where: {
        repositoryId: repository.id,
        createdAt: { gte: monthStart },
        type: { in: ["FILE_UPLOADED", "FILE_UPDATED", "FILE_DELETED"] },
      },
    }),
    prisma.repoActivity.count({
      where: {
        repositoryId: repository.id,
        createdAt: { gte: monthStart },
        type: { in: ["ISSUE_OPENED", "ISSUE_CLOSED", "ISSUE_COMMENTED"] },
      },
    }),
  ]);

  return (
    <section className="grid gap-6">
      <header className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="repo.activity" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {repository.owner.username}/{repository.slug}
        </h1>
      </header>
      <RepoActivityStats
        monthlyUniqueViews={viewStats.monthlyUniqueViews}
        monthlyVisits={viewStats.monthlyVisits}
        allTimeUniqueViews={viewStats.allTimeUniqueViews}
        filesChanged={filesChanged}
        issuesTouched={issuesTouched}
        stars={repository.starCount}
      />
      <ActivityFeed items={activity} titleKey="repo.activity" />
    </section>
  );
}
