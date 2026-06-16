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
    <details className="mf-menu relative shrink-0">
      <summary className="mf-menu-trigger mf-menu-trigger--sm">{t("repo.actions")}</summary>
      <div className="mf-menu-panel">
        <button className="mf-menu-item" type="button" onClick={() => void navigator.clipboard.writeText(path)}>
          {t("repo.copyPath")}
        </button>
        {code ? (
          <button className="mf-menu-item" type="button" onClick={() => void navigator.clipboard.writeText(code)}>
            {t("repo.copyFile")}
          </button>
        ) : null}
        <a className="mf-menu-item" href={rawHref}>
          {t("repo.raw")}
        </a>
        <a className="mf-menu-item" href={downloadHref}>
          {t("repo.download")}
        </a>
      </div>
    </details>
  );
}
