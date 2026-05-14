import type { IssueComment as IssueCommentModel, User } from "@/generated/prisma/client";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/components/issues/markdown";

type IssueCommentProps = {
  comment: Pick<IssueCommentModel, "id" | "body" | "createdAt"> & {
    author: Pick<User, "username">;
  };
};

export function IssueComment({ comment }: IssueCommentProps) {
  return (
    <article className="border-b border-line py-4 last:border-b-0">
      <div className="mb-2 flex flex-wrap gap-2 font-mono text-xs text-faint">
        <span>@{comment.author.username}</span>
        <span>{formatDate(comment.createdAt)}</span>
      </div>
      <Markdown content={comment.body} />
    </article>
  );
}
