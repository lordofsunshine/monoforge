"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, normalizeLocale, type Locale } from "@/lib/i18n/dictionaries";

type PreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  t: (path: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readPath(path: string, locale: Locale) {
  let value: unknown = dictionaries[locale];

  for (const part of path.split(".")) {
    value = typeof value === "object" && value !== null && part in value ? (value as Record<string, unknown>)[part] : undefined;
  }

  return typeof value === "string" ? value : path;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("monoforge-locale");
    const nextLocale = stored === "en" || stored === "ru" ? stored : normalizeLocale(window.navigator.language);
    const storedTheme = window.localStorage.getItem("monoforge-theme");
    const nextTheme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setLocaleState(nextLocale);
    setThemeState(nextTheme);
    document.documentElement.lang = nextLocale;
    document.documentElement.dataset.locale = nextLocale;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        window.localStorage.setItem("monoforge-locale", nextLocale);
        document.documentElement.lang = nextLocale;
        document.documentElement.dataset.locale = nextLocale;
        window.dispatchEvent(new CustomEvent("monoforge-locale-change", { detail: nextLocale }));
      },
      theme,
      setTheme(nextTheme) {
        setThemeState(nextTheme);
        window.localStorage.setItem("monoforge-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      },
      toggleTheme() {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setThemeState(nextTheme);
        window.localStorage.setItem("monoforge-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      },
      t(path) {
        return readPath(path, locale);
      },
    };
  }, [locale, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useI18n() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("useI18n must be used inside PreferencesProvider");
  }

  return context;
}
