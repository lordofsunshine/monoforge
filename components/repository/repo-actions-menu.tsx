import Link from "next/link";
import { LocalizedText } from "@/components/system/localized-text";

type RepoActionsMenuProps = {
  owner: string;
  repo: string;
  canWrite: boolean;
};

export function RepoActionsMenu({ owner, repo, canWrite }: RepoActionsMenuProps) {
  return (
    <details className="mf-menu relative">
      <summary className="mf-menu-trigger">
        <LocalizedText path="repo.actions" />
      </summary>
      <div className="mf-menu-panel">
        <Link className="mf-menu-item" href={`/${owner}/${repo}/board`}>
          <LocalizedText path="repo.board" />
        </Link>
        <Link className="mf-menu-item" href={`/${owner}/${repo}/activity`}>
          <LocalizedText path="repo.activity" />
        </Link>
        {canWrite ? (
          <Link className="mf-menu-item" href={`/${owner}/${repo}/settings`}>
            <LocalizedText path="repo.settings" />
          </Link>
        ) : null}
      </div>
    </details>
  );
}
