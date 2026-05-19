"use client";

import { useI18n } from "@/components/system/preferences-provider";

type ExploreFiltersProps = {
  query: string;
  sort: string;
  language: string;
  hasReadme: boolean;
  languages: string[];
};

export function ExploreFilters({ query, sort, language, hasReadme, languages }: ExploreFiltersProps) {
  const { t } = useI18n();

  return (
    <form className="grid gap-3 rounded-lg border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_160px_150px_auto]">
      <label className="block">
        <span className="sr-only">{t("explore.searchLabel")}</span>
        <input className="h-11 w-full rounded-md border border-line bg-background px-4 text-sm outline-none focus:border-foreground" defaultValue={query} name="q" placeholder={t("explore.searchPlaceholder")} />
      </label>
      <select className="h-11 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground" defaultValue={sort} name="sort">
        <option value="updated">{t("explore.sortUpdated")}</option>
        <option value="stars">{t("explore.sortStars")}</option>
        <option value="size">{t("explore.sortSize")}</option>
      </select>
      <select className="h-11 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-foreground" defaultValue={language} name="language">
        <option value="">{t("explore.allLanguages")}</option>
        {languages.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button className="mf-primary h-11 rounded-md border px-5 text-sm" type="submit">
        {t("common.filter")}
      </button>
      <label className="flex items-center gap-2 text-sm text-secondary md:col-span-4">
        <input className="size-4 accent-foreground" defaultChecked={hasReadme} name="readme" type="checkbox" value="1" />
        {t("explore.withReadme")}
      </label>
    </form>
  );
}
