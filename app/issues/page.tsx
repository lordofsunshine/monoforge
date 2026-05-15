import Link from "next/link";
import { RepositoryVisibility } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export default async function GlobalIssuesPage() {
  const issues = await getPrisma().issue.findMany({
    where: { repository: { visibility: RepositoryVisibility.PUBLIC } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      author: { select: { username: true } },
      labels: { include: { label: true } },
      repository: {
        select: {
          slug: true,
          owner: { select: { username: true } },
        },
      },
    },
  });

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">issues</p>
          <h1 className="mt-2 text-2xl font-semibold">Public issues</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Recent public discussions from repositories you can open without an account.</p>
        </div>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-lineStrong hover:bg-subtle" href="/">
          Search projects
        </Link>
      </header>
      <div className="grid gap-3">
        {issues.length ? (
          issues.map((issue) => (
            <Link
              className="grid gap-2 rounded-lg border border-line bg-surface px-4 py-4 hover:border-lineStrong hover:bg-subtle"
              href={`/${issue.repository.owner.username}/${issue.repository.slug}/issues/${issue.number}`}
              key={issue.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-secondary">
                  {issue.repository.owner.username}/{issue.repository.slug}#{issue.number}
                </span>
                <span className="rounded-sm border border-line px-2 py-0.5 font-mono text-[11px] uppercase text-secondary">{issue.status.toLowerCase()}</span>
              </div>
              <h2 className="font-medium">{issue.title}</h2>
              <p className="line-clamp-2 text-sm leading-6 text-secondary">{issue.digest || issue.body || "No summary."}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-lg border border-line bg-surface px-4 py-12 text-center text-sm text-secondary">No public issues yet.</div>
        )}
      </div>
    </section>
  );
}
