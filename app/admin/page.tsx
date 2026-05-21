import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { formatBytes } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { getStorageRoot } from "@/server/storage/paths";
import { LocalizedText } from "@/components/system/localized-text";

async function directorySize(dir: string): Promise<bigint> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  let total = 0n;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      total += await directorySize(fullPath);
      continue;
    }

    if (entry.isFile()) {
      const info = await stat(fullPath).catch(() => null);
      total += BigInt(info?.size || 0);
    }
  }

  return total;
}

export default async function AdminPage() {
  const session = await auth();

  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const prisma = getPrisma();
  const storageRoot = getStorageRoot();
  const dbSizeRows = await prisma.$queryRaw<Array<{ size: bigint }>>`SELECT pg_database_size(current_database())::bigint AS size`;
  const dbSize = BigInt(dbSizeRows[0]?.size || 0);
  const [users, repositories, publicRepositories, privateRepositories, files, issues, stars, storageBytes, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.repository.count(),
    prisma.repository.count({ where: { visibility: "PUBLIC" } }),
    prisma.repository.count({ where: { visibility: "PRIVATE" } }),
    prisma.repositoryFile.count({ where: { kind: "FILE" } }),
    prisma.issue.count(),
    prisma.star.count(),
    directorySize(storageRoot),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        actor: { select: { username: true, email: true } },
      },
    }),
  ]);

  const cards = [
    ["admin.users", users.toString()],
    ["admin.repositories", repositories.toString()],
    ["admin.publicRepos", publicRepositories.toString()],
    ["admin.privateRepos", privateRepositories.toString()],
    ["admin.files", files.toString()],
    ["admin.issues", issues.toString()],
    ["admin.stars", stars.toString()],
    ["admin.storage", formatBytes(storageBytes)],
    ["admin.database", formatBytes(dbSize)],
    ["admin.totalFootprint", formatBytes(storageBytes + dbSize)],
  ];

  return (
    <section className="grid gap-6">
      <header className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-secondary"><LocalizedText path="admin.eyebrow" /></p>
        <h1 className="mt-2 text-2xl font-semibold"><LocalizedText path="admin.title" /></h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary"><LocalizedText path="admin.description" /></p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <section className="rounded-lg border border-line bg-surface p-4" key={label}>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint"><LocalizedText path={label} /></p>
            <p className="mt-3 truncate text-2xl font-semibold">{value}</p>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="border-b border-line bg-subtle px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary"><LocalizedText path="admin.latestAuditEvents" /></h2>
        </div>
        {auditLogs.length ? (
          auditLogs.map((item) => (
            <div className="grid gap-1 border-b border-line px-4 py-3 text-sm last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_180px]" key={item.id}>
              <p className="font-mono text-xs text-secondary">{item.action.toLowerCase()}</p>
              <p className="min-w-0 truncate">{item.target || item.repositoryId || "service"}</p>
              <p className="font-mono text-xs text-faint md:text-right">{item.actor?.username || item.actor?.email || "system"}</p>
            </div>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-sm text-secondary"><LocalizedText path="admin.noAuditEvents" /></div>
        )}
      </section>
    </section>
  );
}
