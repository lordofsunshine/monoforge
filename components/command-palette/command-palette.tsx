"use client";

import { useEffect, useRef } from "react";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useI18n } from "@/components/system/preferences-provider";

type CommandPaletteProps = {
  username?: string | null;
};

function kindLabel(kind: string) {
  if (kind === "repository") {
    return "repo";
  }

  if (kind === "issue") {
    return "issue";
  }

  return kind;
}

function commandLocaleKey(id: string, field: "title" | "subtitle") {
  return `commands.${id.replaceAll(":", "_").replaceAll("-", "_")}.${field}`;
}

export function CommandPalette({ username }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const palette = useCommandPalette(username);
  const { t } = useI18n();

  useEffect(() => {
    if (palette.open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [palette.open]);

  return (
    <>
      <button
        type="button"
        onClick={() => palette.setOpen(true)}
        className="hidden min-w-56 items-center justify-between rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-secondary hover:border-lineStrong hover:bg-subtle hover:text-foreground md:flex"
        aria-label={t("command.open")}
      >
        <span>{t("command.shortcut")}</span>
        <span className="text-faint">{t("command.label")}</span>
      </button>

      {palette.open ? (
        <div className="fixed inset-0 z-50 bg-background/70 px-4 py-16 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("command.dialog")}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label={t("command.close")} onClick={palette.close} />
          <div className="relative mx-auto max-w-2xl border border-lineStrong bg-surface shadow-2xl">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                palette.executeActive();
              }}
              className="border-b border-line bg-raised"
            >
              <label className="flex items-center gap-3 px-4 py-3 font-mono text-sm">
                <span className="text-faint">&gt;</span>
                <input
                  ref={inputRef}
                  value={palette.query}
                  onChange={(event) => palette.setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-faint"
                  placeholder={palette.repoContext ? t("command.repoPlaceholder") : t("command.globalPlaceholder")}
                  aria-label={t("command.searchLabel")}
                  autoComplete="off"
                  spellCheck={false}
                />
                {palette.loading ? <span className="text-xs text-faint">{t("command.loading")}</span> : null}
              </label>
            </form>

            <div className="max-h-[60dvh] overflow-y-auto p-2">
              {palette.error ? (
                <div className="border border-line px-3 py-6 text-center text-sm text-secondary">{palette.error}</div>
              ) : null}

              {!palette.error && palette.query.trim().length === 1 ? (
                <div className="border border-dashed border-line px-3 py-6 text-center text-sm text-secondary">{t("command.oneMore")}</div>
              ) : null}

              {!palette.error && palette.items.length === 0 && palette.query.trim().length !== 1 && !palette.loading ? (
                <div className="border border-dashed border-line px-3 py-6 text-center text-sm text-secondary">{t("command.empty")}</div>
              ) : null}

              <div className="space-y-1">
                {palette.items.map((item, index) => {
                  const isCommand = "action" in item;
                  const active = index === palette.activeIndex;
                  const title = isCommand ? t(commandLocaleKey(item.id, "title")) : item.title;
                  const subtitle = isCommand ? t(commandLocaleKey(item.id, "subtitle")) : item.subtitle;

                  return (
                    <button
                      key={palette.getResultId(item)}
                      type="button"
                      onMouseEnter={() => palette.setActiveIndex(index)}
                      onClick={() => void palette.executeItem(item)}
                      className={`grid w-full grid-cols-[72px_1fr] gap-3 border px-3 py-2 text-left transition ${
                        active ? "border-lineStrong bg-foreground text-background" : "border-transparent hover:border-line hover:bg-subtle"
                      }`}
                    >
                      <span className={`font-mono text-[11px] uppercase ${active ? "text-background" : "text-faint"}`}>{isCommand ? "cmd" : kindLabel(item.kind)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{title}</span>
                        {subtitle ? <span className={`block truncate text-xs ${active ? "text-background/70" : "text-secondary"}`}>{subtitle}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[11px] text-faint">
              <span>{t("command.enter")}</span>
              <span>{t("command.escape")}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
