"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/components/system/preferences-provider";
import { setMirrorEnabledAction } from "@/lib/mirror/actions";

type MirrorControlProps = {
  enabled: boolean;
  imported: number;
  skipped: number;
  failed: number;
  cursor: string;
  lastRunAt: string | null;
  lastError: string | null;
};

export function MirrorControl({ enabled, imported, skipped, failed, cursor, lastRunAt, lastError }: MirrorControlProps) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState(enabled);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setError("");
    startTransition(async () => {
      try {
        await setMirrorEnabledAction(next);
        setActive(next);
      } catch (toggleError) {
        setError(toggleError instanceof Error ? toggleError.message : "failed");
      }
    });
  }

  const stats: Array<[string, string]> = [
    ["admin.mirrorImported", imported.toString()],
    ["admin.mirrorSkipped", skipped.toString()],
    ["admin.mirrorFailed", failed.toString()],
    ["admin.mirrorCursor", cursor],
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-subtle px-4 py-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">{t("admin.mirrorTitle")}</h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{active ? t("admin.mirrorEnabled") : t("admin.mirrorDisabled")}</span>
      </div>

      <div className="grid gap-4 px-4 py-4">
        <p className="max-w-2xl text-sm leading-6 text-secondary">{t("admin.mirrorDescription")}</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div className="rounded-md border border-line bg-background p-3" key={label}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{t(label)}</p>
              <p className="mt-2 truncate text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-1 text-xs text-faint">
          <p>{t("admin.mirrorLastRun")}: {lastRunAt ? new Date(lastRunAt).toLocaleString(locale) : t("admin.mirrorNever")}</p>
          {lastError ? <p className="break-words">{t("admin.mirrorLastError")}: {lastError}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={toggle}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {active ? t("admin.mirrorDisable") : t("admin.mirrorEnable")}
          </button>
          {error ? <span className="text-xs text-secondary">{error}</span> : null}
        </div>
      </div>
    </section>
  );
}
