import { FileKind, RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { SearchQueryInput } from "@/lib/validation/search";
import type { SearchResponse, SearchResultGroups, SearchResultItem } from "@/types/search";

const emptyGroups: SearchResultGroups = {
  repositories: [],
  users: [],
  issues: [],
  files: [],
};

function hasSearchableQuery(query: string) {
  return query.trim().length >= 2;
}

function canSearchGroup(type: SearchQueryInput["type"], group: SearchQueryInput["type"]) {
  return type === "all" || type === group;
}

function visibleRepositoryWhere(viewerId?: string) {
  return {
    OR: [{ visibility: RepositoryVisibility.PUBLIC }, ...(viewerId ? [{ ownerId: viewerId }] : [])],
  };
}

async function getRepositoryContext(input: SearchQueryInput, viewerId?: string) {
  if (input.scope !== "repo") {
    return null;
  }

  if (!input.owner || !input.repo) {
    return null;
  }

  const repository = await getPrisma().repository.findFirst({
    where: {
      slug: input.repo,
      owner: { username: input.owner },
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
      visibility: true,
      owner: {
        select: { username: true },
      },
    },
  });

  if (!repository) {
    return null;
  }

  if (repository.visibility === RepositoryVisibility.PRIVATE && repository.ownerId !== viewerId) {
    return null;
  }

  return repository;
}

export async function searchMonoForge(input: SearchQueryInput, viewerId?: string): Promise<SearchResponse> {
  const query = input.q.trim();
  const groups: SearchResultGroups = { ...emptyGroups };

  if (!hasSearchableQuery(query)) {
    return {
      query,
      scope: input.scope,
      limit: input.limit,
      offset: input.offset,
      total: 0,
      results: groups,
    };
  }

  if (input.scope === "repo") {
    const repository = await getRepositoryContext(input, viewerId);

    if (!repository) {
      return {
        query,
        scope: input.scope,
        limit: input.limit,
        offset: input.offset,
        total: 0,
        results: groups,
      };
    }

    const [files, issues] = await Promise.all([
      canSearchGroup(input.type, "files")
        ? getPrisma().repositoryFile.findMany({
            where: {
              repositoryId: repository.id,
              kind: FileKind.FILE,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { path: { contains: query, mode: "insensitive" } },
                ...(query.toLowerCase().includes("readme") ? [{ isReadme: true }] : []),
              ],
            },
            orderBy: [{ isReadme: "desc" }, { path: "asc" }],
            skip: input.offset,
            take: input.limit,
            select: {
              id: true,
              path: true,
              name: true,
              size: true,
              language: true,
              isReadme: true,
            },
          })
        : Promise.resolve([]),
      canSearchGroup(input.type, "issues")
        ? getPrisma().issue.findMany({
            where: {
              repositoryId: repository.id,
              OR: [{ title: { contains: query, mode: "insensitive" } }, { digest: { contains: query, mode: "insensitive" } }],
            },
            orderBy: { updatedAt: "desc" },
            skip: input.offset,
            take: input.limit,
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              digest: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    groups.files = files.map<SearchResultItem>((file) => ({
      id: file.id,
      kind: "file",
      title: file.path,
      subtitle: file.isReadme ? "README cover" : file.language ?? file.name,
      href: `/${repository.owner.username}/${repository.slug}/blob/${file.path}`,
      meta: {
        size: file.size.toString(),
        isReadme: file.isReadme,
      },
    }));

    groups.issues = issues.map<SearchResultItem>((issue) => ({
      id: issue.id,
      kind: "issue",
      title: `#${issue.number} ${issue.title}`,
      subtitle: issue.digest ?? issue.status.toLowerCase(),
      href: `/${repository.owner.username}/${repository.slug}/issues/${issue.number}`,
      meta: {
        status: issue.status.toLowerCase(),
        updatedAt: issue.updatedAt.toISOString(),
      },
    }));

    return {
      query,
      scope: input.scope,
      limit: input.limit,
      offset: input.offset,
      total: groups.files.length + groups.issues.length,
      results: groups,
    };
  }

  const [repositories, users, issues] = await Promise.all([
    canSearchGroup(input.type, "repositories")
      ? getPrisma().repository.findMany({
          where: {
            AND: [
              visibleRepositoryWhere(viewerId),
              {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { slug: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
            ],
          },
          orderBy: [{ starCount: "desc" }, { updatedAt: "desc" }],
          skip: input.offset,
          take: input.limit,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            visibility: true,
            starCount: true,
            fileCount: true,
            owner: {
              select: { username: true },
            },
          },
        })
      : Promise.resolve([]),
    canSearchGroup(input.type, "users")
      ? getPrisma().user.findMany({
          where: {
            OR: [{ username: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }],
          },
          orderBy: { lastActiveAt: "desc" },
          skip: input.offset,
          take: input.limit,
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
          },
        })
      : Promise.resolve([]),
    canSearchGroup(input.type, "issues")
      ? getPrisma().issue.findMany({
          where: {
            AND: [
              {
                repository: visibleRepositoryWhere(viewerId),
              },
              {
                OR: [{ title: { contains: query, mode: "insensitive" } }, { digest: { contains: query, mode: "insensitive" } }],
              },
            ],
          },
          orderBy: { updatedAt: "desc" },
          skip: input.offset,
          take: input.limit,
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            digest: true,
            updatedAt: true,
            repository: {
              select: {
                slug: true,
                owner: {
                  select: { username: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  groups.repositories = repositories.map<SearchResultItem>((repository) => ({
    id: repository.id,
    kind: "repository",
    title: `${repository.owner.username}/${repository.slug}`,
    subtitle: repository.description ?? repository.name,
    href: `/${repository.owner.username}/${repository.slug}`,
    meta: {
      visibility: repository.visibility.toLowerCase(),
      stars: repository.starCount,
      files: repository.fileCount,
    },
  }));

  groups.users = users.map<SearchResultItem>((user) => ({
    id: user.id,
    kind: "user",
    title: user.username,
    subtitle: user.bio ?? user.name ?? "MonoForge user",
    href: `/u/${user.username}`,
  }));

  groups.issues = issues.map<SearchResultItem>((issue) => ({
    id: issue.id,
    kind: "issue",
    title: `#${issue.number} ${issue.title}`,
    subtitle: `${issue.repository.owner.username}/${issue.repository.slug} · ${issue.digest ?? issue.status.toLowerCase()}`,
    href: `/${issue.repository.owner.username}/${issue.repository.slug}/issues/${issue.number}`,
    meta: {
      status: issue.status.toLowerCase(),
      updatedAt: issue.updatedAt.toISOString(),
    },
  }));

  return {
    query,
    scope: input.scope,
    limit: input.limit,
    offset: input.offset,
    total: groups.repositories.length + groups.users.length + groups.issues.length + groups.files.length,
    results: groups,
  };
}
