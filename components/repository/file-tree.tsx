import Link from "next/link";
import { FileKind, type RepositoryFile } from "@/generated/prisma/client";
import { LocalizedDate } from "@/components/system/localized-format";
import { LocalizedText } from "@/components/system/localized-text";

type FileTreeItem = Pick<RepositoryFile, "id" | "path" | "name" | "kind" | "size" | "updatedAt">;

type FileTreeProps = {
  owner: string;
  repo: string;
  files: FileTreeItem[];
};

export function FileTree({ owner, repo, files }: FileTreeProps) {
  const sortedFiles = [...files].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === FileKind.DIRECTORY ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-line bg-subtle px-3 font-mono text-xs text-secondary">
        <span className="flex items-center gap-2">
          <LocalizedText path="repo.files" />
          <span className="text-faint">{sortedFiles.length}</span>
        </span>
        {sortedFiles.length ? (
          <a
            className="inline-flex h-7 items-center rounded-md border border-line bg-surface px-2.5 text-xs text-foreground hover:border-lineStrong hover:bg-subtle"
            href={`/api/repositories/${owner}/${repo}/archive`}
          >
            <LocalizedText path="repo.download" />
          </a>
        ) : null}
      </div>
      {sortedFiles.length ? (
        sortedFiles.map((file) => {
          const href = file.kind === FileKind.DIRECTORY ? `/${owner}/${repo}/tree/${file.path}` : `/${owner}/${repo}/blob/${file.path}`;

          return (
            <Link className="grid min-h-9 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3 font-mono text-xs last:border-b-0 hover:bg-subtle" href={href} key={file.id}>
              <span className="min-w-0 truncate">
                {file.kind === FileKind.DIRECTORY ? "./" : ""}
                {file.name}
              </span>
              <span className="text-faint">
                <LocalizedDate value={file.updatedAt} />
              </span>
            </Link>
          );
        })
      ) : (
        <div className="px-4 py-10 text-center text-sm text-secondary">
          <LocalizedText path="repo.noFiles" />
        </div>
      )}
    </div>
  );
}
