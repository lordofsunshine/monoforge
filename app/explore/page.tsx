import type { Metadata } from "next";
import Link from "next/link";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { LanguageStrip } from "@/components/repository/language-strip";
import { LocalizedCount, LocalizedDate } from "@/components/system/localized-format";
import { LocalizedText } from "@/components/system/localized-text";
import { RepositoryStatus, RepositoryVisibility } from "@/generated/prisma/client";
import { formatBytes } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { getRepositoryLanguages } from "@/server/repositories/languages";

export const metadata: Metadata = {
  title: "Explore public projects",
  description: "Find public repositories, README files and project work published on MonoForge.",
  alternates: {
    canonical: "/explore",
  },
};

type ExplorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = new Set(["updated", "stars", "size"]);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanQuery(value: string | undefined) {
  return (value || "").trim().slice(0, 80);
}

function cleanLanguage(value: string | undefined) {
  const next = (value || "").trim().slice(0, 32);
  return /^[\w#+.-]+$/i.test(next) ? next : "";
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = cleanQuery(firstParam(params.q));
  const sort = sortOptions.has(firstParam(params.sort) || "") ? firstParam(params.sort)! : "updated";
  const language = cleanLanguage(firstParam(params.language));
  const hasReadme = firstParam(params.readme) === "1";
  const prisma = getPrisma();
  const orderBy = sort === "stars" ? { starCount: "desc" as const } : sort === "size" ? { repoSize: "desc" as const } : { updatedAt: "desc" as const };

  const [languages, repositories] = await Promise.all([
    prisma.repositoryFile.findMany({
      where: {
        language: { not: null },
        repository: {
          visibility: RepositoryVisibility.PUBLIC,
          status: RepositoryStatus.ACTIVE,
        },
      },
      distinct: ["language"],
      orderBy: { language: "asc" },
      take: 80,
      select: { language: true },
    }),
    prisma.repository.findMany({
      where: {
        visibility: RepositoryVisibility.PUBLIC,
        status: RepositoryStatus.ACTIVE,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { slug: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { owner: { username: { contains: query, mode: "insensitive" as const } } },
              ],
            }
          : {}),
        ...(language ? { files: { some: { language: { equals: language, mode: "insensitive" as const } } } } : {}),
        ...(hasReadme ? { readmePath: { not: null } } : {}),
      },
      orderBy: [orderBy, { updatedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        fileCount: true,
        repoSize: true,
        starCount: true,
        readmePath: true,
        updatedAt: true,
        owner: { select: { username: true } },
      },
    }),
  ]);

  const cards = await Promise.all(
    repositories.map(async (repository) => ({
      repository,
      languages: await getRepositoryLanguages(repository.id),
    })),
  );

  return (
    <section className="grid gap-6">
      <header className="border-b border-line pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
          <LocalizedText path="explore.eyebrow" />
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          <LocalizedText path="explore.title" />
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
          <LocalizedText path="explore.description" />
        </p>
      </header>

      <ExploreFilters query={query} sort={sort} language={language} hasReadme={hasReadme} languages={languages.map((item) => item.language).filter((item): item is string => Boolean(item))} />

      <div className="grid gap-3">
        {cards.length ? (
          cards.map(({ repository, languages: repoLanguages }) => (
            <Link className="grid gap-4 rounded-lg border border-line bg-surface p-4 hover:border-lineStrong hover:bg-subtle md:grid-cols-[minmax(0,1fr)_auto]" href={`/${repository.owner.username}/${repository.slug}`} key={repository.id}>
              <div className="min-w-0">
                <p className="break-words font-mono text-sm text-secondary">
                  {repository.owner.username} / {repository.slug}
                </p>
                <h2 className="mt-2 break-words text-xl font-semibold">{repository.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">{repository.description || <LocalizedText path="common.noDescription" />}</p>
                <div className="mt-4">
                  <LanguageStrip languages={repoLanguages} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 font-mono text-xs text-faint md:justify-end">
                <span>
                  <LocalizedCount value={repository.fileCount} unit="files" />
                </span>
                <span>
                  <LocalizedCount value={repository.starCount} unit="stars" />
                </span>
                <span>{formatBytes(repository.repoSize)}</span>
                <span>
                  <LocalizedDate value={repository.updatedAt} />
                </span>
                {repository.readmePath ? <span>README</span> : null}
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-lg border border-line bg-surface px-4 py-14 text-center text-sm text-secondary">
            <LocalizedText path="explore.empty" />
          </div>
        )}
      </div>
    </section>
  );
}
