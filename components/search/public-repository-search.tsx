"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/system/preferences-provider";
import type { SearchResponse, SearchResultItem } from "@/types/search";

function resultMeta(item: SearchResultItem, t: (path: string) => string) {
  if (item.kind === "repository") {
    return `${item.meta?.stars ?? 0} ${t("common.stars")} · ${item.meta?.files ?? 0} ${t("common.files")}`;
  }

  if (item.kind === "issue") {
    return item.meta?.status ? String(item.meta.status) : "issue";
  }

  return item.kind;
}

export function PublicRepositorySearch() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=12`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = (await response.json()) as SearchResponse;
        setResults([...payload.results.repositories, ...payload.results.users, ...payload.results.issues]);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        setError(t("search.unavailable"));
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, t]);

  return (
    <section className="w-full max-w-3xl rounded-lg border border-line bg-surface p-3">
      <label className="block">
        <span className="sr-only">{t("search.publicLabel")}</span>
        <input
          className="h-12 w-full rounded-md border border-line bg-background px-4 text-base outline-none placeholder:text-faint hover:border-lineStrong focus:border-foreground focus:ring-2 focus:ring-focus/20"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.publicPlaceholder")}
          value={query}
        />
      </label>
      <div className="mt-3 min-h-10">
        {query.trim().length === 1 ? <p className="px-1 text-sm text-secondary">{t("search.oneMore")}</p> : null}
        {loading ? <p className="px-1 text-sm text-secondary">{t("search.searching")}</p> : null}
        {error ? <p className="px-1 text-sm text-secondary">{error}</p> : null}
        {!loading && !error && query.trim().length >= 2 && !results.length ? <p className="px-1 text-sm text-secondary">{t("search.noPublicResults")}</p> : null}
        {results.length ? (
          <div className="grid gap-1">
            {results.map((item) => (
              <Link className="grid gap-1 rounded-md border border-transparent px-3 py-2 hover:border-line hover:bg-subtle md:grid-cols-[1fr_auto]" href={item.href} key={`${item.kind}-${item.id}`}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  {item.subtitle ? <span className="block truncate text-xs text-secondary">{item.subtitle}</span> : null}
                </span>
                <span className="font-mono text-xs text-faint">{resultMeta(item, t)}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
