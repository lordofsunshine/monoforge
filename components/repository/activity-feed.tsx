import Link from "next/link";
import { LocalizedDate } from "@/components/system/localized-format";
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

function activityGroupKey(type: string) {
  if (type === "FILE_UPLOADED") return "activityGroup.uploaded";
  if (type === "FILE_UPDATED") return "activityGroup.updated";
  if (type === "FILE_DELETED") return "activityGroup.deleted";
  if (type === "ISSUE_OPENED") return "activityGroup.openedIssues";
  if (type === "ISSUE_CLOSED") return "activityGroup.closedIssues";
  if (type === "ISSUE_COMMENTED") return "activityGroup.comments";
  if (type === "STAR_ADDED") return "activityGroup.stars";
  return "activityGroup.changed";
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function groupItems(items: ActivityFeedItem[]) {
  const groups = new Map<string, { day: Date; type: string; titleKey: string; items: ActivityFeedItem[] }>();

  for (const item of items) {
    const key = `${dayKey(item.createdAt)}:${item.type}`;
    const current = groups.get(key);

    if (current) {
      current.items.push(item);
      continue;
    }

    groups.set(key, {
      day: item.createdAt,
      type: item.type,
      titleKey: activityGroupKey(item.type),
      items: [item],
    });
  }

  return Array.from(groups.values()).sort((left, right) => right.day.getTime() - left.day.getTime());
}

export function ActivityFeed({ items, title = "activity", titleKey }: ActivityFeedProps) {
  const groups = groupItems(items);

  return (
    <section className="min-w-0 rounded-lg border border-line bg-surface p-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">{titleKey ? <LocalizedText path={titleKey} /> : title}</h2>
      <div className="mt-3 grid gap-3">
        {groups.length ? (
          groups.map((group) => (
            <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0" key={`${dayKey(group.day)}:${group.type}`}>
              <span className="font-mono text-xs text-faint">{activityMarker(group.type)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  <LocalizedText path={group.titleKey} /> <span className="font-mono text-faint">×{group.items.length}</span>
                </p>
                <p className="mt-1 truncate font-mono text-xs text-faint">
                  <LocalizedDate value={group.day} />
                </p>
                <div className="mt-2 grid gap-1">
                  {group.items.slice(0, 3).map((item) => {
                    const repoHref = item.repository ? `/${item.repository.owner.username}/${item.repository.slug}` : null;
                    const issueHref = repoHref && item.issueNumber ? `${repoHref}/issues/${item.issueNumber}` : null;
                    const href = issueHref || repoHref;

                    return (
                      <p className="truncate text-xs text-secondary" key={item.id}>
                        {href ? (
                          <Link className="hover:underline" href={href}>
                            {item.title}
                          </Link>
                        ) : (
                          item.title
                        )}
                        {item.targetPath ? <span className="text-faint"> · {item.targetPath}</span> : null}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-secondary">
            <LocalizedText path="activity.empty" />
          </p>
        )}
      </div>
    </section>
  );
}
