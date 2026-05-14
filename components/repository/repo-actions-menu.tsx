import Link from "next/link";
import { LocalizedText } from "@/components/system/localized-text";

type RepoActionsMenuProps = {
  archiveUrl: string;
  owner: string;
  repo: string;
  canWrite: boolean;
};

export function RepoActionsMenu({ archiveUrl, owner, repo, canWrite }: RepoActionsMenuProps) {
  return (
    <details className="mf-menu relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle">
        <LocalizedText path="nav.menu" />
      </summary>
      <div className="absolute right-0 top-11 z-30 grid w-48 gap-1 rounded-lg border border-line bg-surface p-2 shadow-xl">
        <Link className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={archiveUrl}>
          <LocalizedText path="repo.downloadZip" />
        </Link>
        <Link className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={`/${owner}/${repo}/board`}>
          <LocalizedText path="repo.board" />
        </Link>
        <Link className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={`/${owner}/${repo}/activity`}>
          <LocalizedText path="repo.activity" />
        </Link>
        {canWrite ? (
          <Link className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={`/${owner}/${repo}/settings`}>
            <LocalizedText path="repo.settings" />
          </Link>
        ) : null}
      </div>
    </details>
  );
}
