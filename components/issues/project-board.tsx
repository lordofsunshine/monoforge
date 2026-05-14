import Link from "next/link";
import { IssueBoardStatus, type Issue, type IssueLabel, type User } from "@/generated/prisma/client";
import { LabelBadge } from "@/components/issues/label-badge";
import { LocalizedText } from "@/components/system/localized-text";

type BoardIssue = Pick<Issue, "id" | "number" | "title" | "priority" | "boardStatus"> & {
  author: Pick<User, "username">;
  labels: Array<{ label: Pick<IssueLabel, "name" | "marker" | "pattern"> }>;
};

type ProjectBoardProps = {
  owner: string;
  repo: string;
  issues: BoardIssue[];
};

const columns = [
  { key: IssueBoardStatus.TODO, titleKey: "issuesPage.todo" },
  { key: IssueBoardStatus.IN_PROGRESS, titleKey: "issuesPage.inProgress" },
  { key: IssueBoardStatus.DONE, titleKey: "issuesPage.done" },
];

export function ProjectBoard({ owner, repo, issues }: ProjectBoardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => {
        const columnIssues = issues.filter((issue) => issue.boardStatus === column.key);

        return (
          <section className="rounded-lg border border-line bg-surface" key={column.key}>
            <div className="flex h-11 items-center justify-between border-b border-line bg-subtle px-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
                <LocalizedText path={column.titleKey} />
              </h2>
              <span className="font-mono text-xs text-faint">{columnIssues.length}</span>
            </div>
            <div className="grid gap-3 p-3">
              {columnIssues.length ? (
                columnIssues.map((issue) => (
                  <Link className="grid gap-2 rounded-md border border-line bg-surface p-3 hover:border-lineStrong hover:bg-subtle" href={`/${owner}/${repo}/issues/${issue.number}`} key={issue.id}>
                    <p className="text-sm font-medium">
                      #{issue.number} {issue.title}
                    </p>
                    <p className="font-mono text-xs text-faint">@{issue.author.username} · {issue.priority.toLowerCase()}</p>
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.map(({ label }) => (
                        <LabelBadge key={label.name} label={label} />
                      ))}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-2 py-8 text-center text-sm text-secondary">
                  <LocalizedText path="issuesPage.empty" />
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
