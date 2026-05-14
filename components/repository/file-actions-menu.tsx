import Link from "next/link";
import { DeleteFileForm } from "@/components/repository/delete-file-form";
import { LocalizedText } from "@/components/system/localized-text";

type FileActionsMenuProps = {
  owner: string;
  repo: string;
  path: string;
  downloadHref: string;
  repositoryId: string;
  canWrite: boolean;
  signedIn: boolean;
};

export function FileActionsMenu({ owner, repo, path, downloadHref, repositoryId, canWrite, signedIn }: FileActionsMenuProps) {
  return (
    <details className="mf-menu relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle">
        <LocalizedText path="nav.menu" />
      </summary>
      <div className="absolute right-0 top-11 z-30 grid w-56 gap-1 rounded-lg border border-line bg-surface p-2 shadow-xl">
        {signedIn ? (
          <Link className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={`/${owner}/${repo}/issues/new?path=${encodeURIComponent(path)}`}>
            <LocalizedText path="repo.issueFromFile" />
          </Link>
        ) : null}
        <a className="rounded-md px-3 py-2 text-sm hover:bg-subtle" href={downloadHref}>
          <LocalizedText path="repo.download" />
        </a>
        {canWrite ? <DeleteFileForm repositoryId={repositoryId} path={path} redirectTo={`/${owner}/${repo}`} compact /> : null}
      </div>
    </details>
  );
}
