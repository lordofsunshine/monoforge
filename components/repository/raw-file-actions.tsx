"use client";

import { useI18n } from "@/components/system/preferences-provider";

type RawFileActionsProps = {
  path: string;
  rawHref: string;
  downloadHref: string;
  code?: string | null;
};

export function RawFileActions({ path, rawHref, downloadHref, code }: RawFileActionsProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 font-mono text-xs hover:border-lineStrong hover:bg-subtle"
        type="button"
        onClick={() => void navigator.clipboard.writeText(path)}
      >
        {t("repo.copyPath")}
      </button>
      {code ? (
        <button
          className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 font-mono text-xs hover:border-lineStrong hover:bg-subtle"
          type="button"
          onClick={() => void navigator.clipboard.writeText(code)}
        >
          {t("repo.copyFile")}
        </button>
      ) : null}
      <details className="mf-menu relative">
        <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-line bg-surface px-3 font-mono text-xs hover:border-lineStrong hover:bg-subtle">
          {t("nav.menu")}
        </summary>
        <div className="absolute right-0 top-10 z-30 grid w-40 gap-1 rounded-lg border border-line bg-surface p-2 shadow-xl">
          <a className="rounded-md px-3 py-2 font-mono text-xs hover:bg-subtle" href={rawHref}>
            {t("repo.raw")}
          </a>
          <a className="rounded-md px-3 py-2 font-mono text-xs hover:bg-subtle" href={downloadHref}>
            {t("repo.download")}
          </a>
        </div>
      </details>
    </div>
  );
}
