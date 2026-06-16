"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/system/preferences-provider";

type UserMenuProps = {
  username?: string | null;
  isAdmin?: boolean;
};

export function UserMenu({ username, isAdmin = false }: UserMenuProps) {
  const { locale, setLocale, theme, toggleTheme, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const nextLocale = locale === "en" ? "ru" : "en";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm hover:border-lineStrong hover:bg-subtle"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{t("nav.menu")}</span>
        <span className="font-mono text-xs text-faint">{locale.toUpperCase()}</span>
      </button>
      {open ? (
        <div className="mf-menu-panel z-50 w-64" role="menu">
          <div className="border-b border-line px-3 py-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{t("nav.view")}</p>
          </div>
          <button
            type="button"
            className="mf-menu-item mf-menu-item--split"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
            role="menuitem"
          >
            <span>{t("nav.theme")}</span>
            <span className="font-mono text-xs uppercase text-faint">{t(`nav.${theme}`)}</span>
          </button>
          <button
            type="button"
            className="mf-menu-item mf-menu-item--split"
            onClick={() => {
              setLocale(nextLocale);
              setOpen(false);
            }}
            role="menuitem"
          >
            <span>{t("nav.language")}</span>
            <span className="font-mono text-xs uppercase text-faint">{t(`nav.${nextLocale}`)}</span>
          </button>
          <div className="my-1 border-t border-line" />
          <Link className="mf-menu-item" href="/docs" onClick={() => setOpen(false)} role="menuitem">
            {t("nav.docs")}
          </Link>
          <Link className="mf-menu-item" href="/rules" onClick={() => setOpen(false)} role="menuitem">
            {t("nav.rules")}
          </Link>
          {username ? (
            <>
              <div className="my-1 border-t border-line" />
              <Link className="mf-menu-item sm:hidden" href="/dashboard" onClick={() => setOpen(false)} role="menuitem">
                {t("nav.dashboard")}
              </Link>
              <Link className="mf-menu-item sm:hidden" href={`/u/${username}`} onClick={() => setOpen(false)} role="menuitem">
                {t("nav.profile")}
              </Link>
              {isAdmin ? (
                <Link className="mf-menu-item" href="/admin" onClick={() => setOpen(false)} role="menuitem">
                  Admin
                </Link>
              ) : null}
              <Link className="mf-menu-item" href="/settings/profile" onClick={() => setOpen(false)} role="menuitem">
                {t("nav.settings")}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
