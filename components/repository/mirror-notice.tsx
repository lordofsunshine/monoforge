"use client";

import { useI18n } from "@/components/system/preferences-provider";

type MirrorNoticeProps = {
  sourceUrl: string;
  compact?: boolean;
};

export function MirrorNotice({ sourceUrl, compact = false }: MirrorNoticeProps) {
  const { t } = useI18n();

  return (
    <div className={`overflow-hidden rounded-lg border border-line ${compact ? "bg-surface" : "bg-subtle"}`}>
      <div className="border-b border-line px-4 py-3">
        <p className="text-sm leading-6 text-secondary">{t("repo.mirrorNotice")}</p>
      </div>
      <div className="grid gap-3 px-4 py-3">
        <div className="grid gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{t("repo.mirrorSource")}</p>
          <a
            className="block overflow-x-auto rounded-md border border-line bg-background px-3 py-2.5 font-mono text-xs text-foreground underline-offset-4 hover:border-lineStrong hover:underline"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <span className="whitespace-nowrap">{sourceUrl}</span>
          </a>
        </div>
        <p className="text-xs leading-5 text-faint">
          <a className="text-secondary underline-offset-4 hover:text-foreground hover:underline" href="https://t.me/bobiku228" target="_blank" rel="noopener noreferrer">
            {t("repo.mirrorReport")}
          </a>
        </p>
      </div>
    </div>
  );
}
