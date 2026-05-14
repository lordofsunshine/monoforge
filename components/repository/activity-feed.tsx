import Link from "next/link";
import { formatDate } from "@/lib/format";
import { LocalizedText } from "@/components/system/localized-text";

type ActivityFeedItem = {
  id: string;
  title: string;
  type: string;
  targetPath?: string | null;
  issueNumber?: number | null;
  createdAt: Date;
  actor?: {
    username: string;
  } | null;
  repository?: {
    slug: string;
    owner: {
      username: string;
    };
  };
};

type ActivityFeedProps = {
  items: ActivityFeedItem[];
  title?: string;
  titleKey?: string;
};

function activityMarker(type: string) {
  if (type.includes("ISSUE")) return "[!]";
  if (type.includes("STAR")) return "[*]";
  if (type.includes("FILE")) return "[f]";
  return "[r]";
}

export function ActivityFeed({ items, title = "activity", titleKey }: ActivityFeedProps) {
  return (
    <section className="min-w-0 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">{titleKey ? <LocalizedText path={titleKey} /> : title}</h2>
      <div className="mt-3 grid gap-3">
        {items.length ? (
          items.map((item) => {
            const repoHref = item.repository ? `/${item.repository.owner.username}/${item.repository.slug}` : null;
            const issueHref = repoHref && item.issueNumber ? `${repoHref}/issues/${item.issueNumber}` : null;

            return (
              <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0" key={item.id}>
                <span className="font-mono text-xs text-faint">{activityMarker(item.type)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {issueHref ? (
                      <Link className="hover:underline" href={issueHref}>
                        {item.title}
                      </Link>
                    ) : repoHref ? (
                      <Link className="hover:underline" href={repoHref}>
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-faint">
                    {item.actor?.username ?? <LocalizedText path="activity.system" />} · {formatDate(item.createdAt)}
                    {item.targetPath ? ` · ${item.targetPath}` : ""}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-secondary">
            <LocalizedText path="activity.empty" />
          </p>
        )}
      </div>
    </section>
  );
}
