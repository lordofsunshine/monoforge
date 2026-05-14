import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { RepositoryVisibility } from "@/generated/prisma/client";
import { LocalizedText } from "@/components/system/localized-text";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      image: true,
      repositories: {
        where: {
          visibility: RepositoryVisibility.PUBLIC,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          starCount: true,
          issueCount: true,
          repoSize: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          repositories: true,
          issues: true,
          stars: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalStars = user.repositories.reduce((sum, repository) => sum + repository.starCount, 0);

  return (
    <section className="grid gap-8">
      <header className="grid gap-6 border-b border-line pb-8 md:grid-cols-[auto_1fr] md:items-end">
        <div className="grid size-24 place-items-center overflow-hidden rounded-lg border border-line bg-subtle font-mono text-2xl font-semibold">
          {user.image ? (
            <img src={user.image} alt={`${user.username} avatar`} width={96} height={96} className="size-full object-cover grayscale" referrerPolicy="no-referrer" />
          ) : (
            user.username.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-mono text-sm text-secondary">@{user.username}</p>
          <h1 className="mt-1 text-3xl font-semibold">{user.name || user.username}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">{user.bio || <LocalizedText path="common.noDescription" />}</p>
          <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs text-faint">
            <span>{user._count.repositories} <LocalizedText path="dashboard.repositories" /></span>
            <span>{totalStars} <LocalizedText path="common.stars" /></span>
            <span>{user._count.issues} <LocalizedText path="common.issues" /></span>
            <Link className="hover:text-foreground" href={`/u/${user.username}/stars`}>
              <LocalizedText path="profile.starredRepositories" />
            </Link>
          </div>
        </div>
      </header>
      <div className="grid gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="profile.publicRepositories" />
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {user.repositories.length ? (
            user.repositories.map((repository) => (
              <Link
                className="grid gap-2 border-b border-line px-4 py-4 last:border-b-0 hover:bg-subtle md:grid-cols-[1fr_auto]"
                href={`/${user.username}/${repository.slug}`}
                key={repository.id}
              >
                <div>
                  <p className="font-medium">{repository.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{repository.description || <LocalizedText path="common.noDescription" />}</p>
                </div>
                <div className="font-mono text-xs text-faint">
                  {repository.starCount} <LocalizedText path="common.stars" /> · {repository.issueCount} <LocalizedText path="common.issues" />
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-sm text-secondary">
              <LocalizedText path="profile.noPublicRepos" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
