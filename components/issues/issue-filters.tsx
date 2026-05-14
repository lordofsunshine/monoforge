"use client";

import Link from "next/link";
import type { IssueLabel } from "@/generated/prisma/client";
import { LabelBadge } from "@/components/issues/label-badge";
import { LocalizedText } from "@/components/system/localized-text";
import { useI18n } from "@/components/system/preferences-provider";

type IssueFiltersProps = {
  owner: string;
  repo: string;
  labels: Array<Pick<IssueLabel, "slug" | "name" | "marker" | "pattern">>;
  active: {
    status: string;
    label?: string;
    author?: string;
    q?: string;
    sort: string;
  };
};

function queryHref(owner: string, repo: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return `/${owner}/${repo}/issues${query ? `?${query}` : ""}`;
}

export function IssueFilters({ owner, repo, labels, active }: IssueFiltersProps) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-surface p-4">
      <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" action={`/${owner}/${repo}/issues`}>
        <input type="hidden" name="status" value={active.status} />
        <input type="hidden" name="label" value={active.label || ""} />
        <input
          className="h-9 rounded-md border border-line bg-surface px-3 text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          name="q"
          defaultValue={active.q || ""}
          placeholder={t("issuesPage.searchIssues")}
        />
        <input
          className="h-9 rounded-md border border-line bg-surface px-3 font-mono text-sm outline-none hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          name="author"
          defaultValue={active.author || ""}
          placeholder={t("issuesPage.author")}
        />
        <select className="h-9 rounded-md border border-line bg-surface px-3 text-sm" name="sort" defaultValue={active.sort}>
          <option value="newest">{t("issuesPage.newest")}</option>
          <option value="oldest">{t("issuesPage.oldest")}</option>
        </select>
        <button className="h-9 rounded-md border border-line px-3 text-sm hover:border-lineStrong hover:bg-subtle" type="submit">
          <LocalizedText path="common.filter" />
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {["open", "closed", "all"].map((status) => (
          <Link
            key={status}
            className={`rounded-md border px-3 py-1.5 text-sm ${active.status === status ? "border-foreground bg-subtle" : "border-line hover:border-lineStrong"}`}
            href={queryHref(owner, repo, { ...active, status })}
          >
            <LocalizedText path={`common.${status}`} />
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className={`rounded-sm border px-2 py-1 font-mono text-xs ${!active.label ? "border-foreground bg-subtle" : "border-line"}`} href={queryHref(owner, repo, { ...active, label: undefined })}>
          <LocalizedText path="issuesPage.allLabels" />
        </Link>
        {labels.map((label) => (
          <Link key={label.slug} href={queryHref(owner, repo, { ...active, label: label.slug })}>
            <LabelBadge label={label} />
          </Link>
        ))}
      </div>
    </div>
  );
}
