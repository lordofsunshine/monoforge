import Link from "next/link";
import { IssuePriority, IssueStatus, type Issue, type IssueLabel, type User } from "@/generated/prisma/client";
import { LabelBadge } from "@/components/issues/label-badge";
import { LocalizedCount, LocalizedDate } from "@/components/system/localized-format";
import { LocalizedText } from "@/components/system/localized-text";

type IssueWithBits = Pick<Issue, "id" | "number" | "title" | "digest" | "status" | "priority" | "commentCount" | "updatedAt" | "sourcePath" | "sourceLine"> & {
  author: Pick<User, "username">;
  labels: Array<{ label: Pick<IssueLabel, "name" | "marker" | "pattern"> }>;
};

type IssueCardProps = {
  issue: IssueWithBits;
  href: string;
};

export function IssueCard({ issue, href }: IssueCardProps) {
  const priorityClass =
    issue.priority === IssuePriority.URGENT
      ? "border-l-4"
      : issue.priority === IssuePriority.HIGH
        ? "border-l-2"
        : issue.priority === IssuePriority.LOW
          ? "border-l border-l-line"
          : "border-l-2 border-l-lineStrong";

  return (
    <article className={`grid gap-3 border-b border-line px-4 py-4 last:border-b-0 hover:bg-subtle ${priorityClass}`}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="font-medium text-foreground underline-offset-4 hover:underline">
            #{issue.number} {issue.title}
          </Link>
          <p className="mt-1 line-clamp-1 text-sm text-secondary">{issue.digest || <LocalizedText path="issuesPage.noDigest" />}</p>
        </div>
        <span className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase ${issue.status === IssueStatus.OPEN ? "border-solid" : "border-dashed text-secondary"}`}>
          {issue.status.toLowerCase()}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {issue.labels.map(({ label }) => (
          <LabelBadge key={label.name} label={label} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 font-mono text-xs text-faint">
        <span>@{issue.author.username}</span>
        <span><LocalizedCount value={issue.commentCount} unit="comments" /></span>
        <span><LocalizedDate value={issue.updatedAt} /></span>
        {issue.sourcePath ? (
          <span>
            {issue.sourcePath}
            {issue.sourceLine ? `:${issue.sourceLine}` : ""}
          </span>
        ) : null}
      </div>
    </article>
  );
}
