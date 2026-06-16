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
      <summary className="mf-menu-trigger">
        <LocalizedText path="repo.actions" />
      </summary>
      <div className="mf-menu-panel">
        {signedIn ? (
          <Link className="mf-menu-item" href={`/${owner}/${repo}/issues/new?path=${encodeURIComponent(path)}`}>
            <LocalizedText path="repo.issueFromFile" />
          </Link>
        ) : null}
        <a className="mf-menu-item" href={downloadHref}>
          <LocalizedText path="repo.download" />
        </a>
        {canWrite ? <DeleteFileForm repositoryId={repositoryId} path={path} redirectTo={`/${owner}/${repo}`} compact /> : null}
      </div>
    </details>
  );
}
