import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RepositoryVisibility } from "@/generated/prisma/client";
import { formatBytes } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { LocalizedCount } from "@/components/system/localized-format";
import { LocalizedText } from "@/components/system/localized-text";

type StarredPageProps = {
  params: Promise<{ username: string }>;
};

export default async function StarredRepositoriesPage({ params }: StarredPageProps) {
  const { username } = await params;
  const session = await auth();
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      name: true,
    },
  });

  if (!user) {
    notFound();
  }

  const stars = await prisma.star.findMany({
    where: {
      userId: user.id,
      repository: {
        OR: [{ visibility: RepositoryVisibility.PUBLIC }, ...(session?.user?.id ? [{ ownerId: session.user.id }] : [])],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      repository: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          visibility: true,
          repoSize: true,
          starCount: true,
          issueCount: true,
          owner: {
            select: { username: true },
          },
        },
      },
    },
  });

  return (
    <section className="grid gap-6">
      <header className="border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="profile.quietPopularity" />
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{user.name || user.username} starred</h1>
        <p className="mt-3 text-sm text-secondary">
          <LocalizedText path="profile.starredRepositories" />
        </p>
      </header>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {stars.length ? (
          stars.map((star) => (
            <Link
              className="grid gap-2 border-b border-line px-4 py-4 last:border-b-0 hover:bg-subtle md:grid-cols-[1fr_auto]"
              href={`/${star.repository.owner.username}/${star.repository.slug}`}
              key={star.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">
                    {star.repository.owner.username}/{star.repository.slug}
                  </p>
                  <span className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] uppercase text-secondary">
                    {star.repository.visibility.toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{star.repository.description || star.repository.name}</p>
              </div>
              <div className="font-mono text-xs text-faint">
                {formatBytes(star.repository.repoSize)} · <LocalizedCount value={star.repository.starCount} unit="stars" /> · <LocalizedCount value={star.repository.issueCount} unit="issues" />
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-sm text-secondary">
            <LocalizedText path="profile.noStarredRepos" />
          </div>
        )}
      </div>
    </section>
  );
}
