import { IssueCard } from "@/components/issues/issue-card";
import { LocalizedText } from "@/components/system/localized-text";
import type { Issue, IssueLabel, User } from "@/generated/prisma/client";

type IssueListProps = {
  owner: string;
  repo: string;
  issues: Array<Pick<Issue, "id" | "number" | "title" | "digest" | "status" | "priority" | "commentCount" | "updatedAt" | "sourcePath" | "sourceLine"> & {
    author: Pick<User, "username">;
    labels: Array<{ label: Pick<IssueLabel, "name" | "marker" | "pattern"> }>;
  }>;
};

export function IssueList({ owner, repo, issues }: IssueListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {issues.length ? (
        issues.map((issue) => <IssueCard key={issue.id} issue={issue} href={`/${owner}/${repo}/issues/${issue.number}`} />)
      ) : (
        <div className="px-4 py-12 text-center text-sm text-secondary">
          <LocalizedText path="issuesPage.noIssues" />
        </div>
      )}
    </div>
  );
}
