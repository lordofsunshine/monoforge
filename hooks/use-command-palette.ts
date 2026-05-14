"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { filterCommands, getBaseCommands, getRepoContext, type CommandItem } from "@/components/command-palette/commands";
import { useI18n } from "@/components/system/preferences-provider";
import type { SearchResponse, SearchResultItem } from "@/types/search";

type PaletteResult = SearchResultItem | CommandItem;

function isCommandItem(item: PaletteResult): item is CommandItem {
  return "action" in item;
}

function getResultId(item: PaletteResult) {
  return isCommandItem(item) ? item.id : `${item.kind}:${item.id}`;
}

function setFocusMode(value: string) {
  document.documentElement.dataset.focusMode = value;
  window.localStorage.setItem("monoforge-focus-mode", value);
}

export function useCommandPalette(username?: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleTheme, t } = useI18n();
  const repoContext = useMemo(() => getRepoContext(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => {
    return getBaseCommands({ username, repoContext }).filter((command) => {
      if (command.requiresRepo && !repoContext) {
        return false;
      }

      if (command.requiresUser && !username) {
        return false;
      }

      return true;
    });
  }, [repoContext, username]);

  const visibleCommands = useMemo(() => filterCommands(commands, query), [commands, query]);

  const searchResults = useMemo(() => {
    if (!searchResponse) {
      return [];
    }

    return [
      ...searchResponse.results.repositories,
      ...searchResponse.results.users,
      ...searchResponse.results.issues,
      ...searchResponse.results.files,
    ];
  }, [searchResponse]);

  const items = useMemo<PaletteResult[]>(() => {
    if (query.trim().length < 2) {
      return visibleCommands;
    }

    return [...visibleCommands, ...searchResults];
  }, [query, searchResults, visibleCommands]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("monoforge-theme");
    const storedFocusMode = window.localStorage.getItem("monoforge-focus-mode");

    if (storedTheme === "dark" || storedTheme === "light") {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }

    if (storedFocusMode === "on" || storedFocusMode === "off") {
      document.documentElement.dataset.focusMode = storedFocusMode;
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isOpenShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (isOpenShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (items.length ? (current + 1) % items.length : 0));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (items.length ? (current - 1 + items.length) % items.length : 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items.length, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setSearchResponse(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          q: query.trim(),
          limit: "20",
          offset: "0",
          scope: repoContext ? "repo" : "global",
        });

        if (repoContext) {
          params.set("owner", repoContext.owner);
          params.set("repo", repoContext.repo);
        }

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        setSearchResponse((await response.json()) as SearchResponse);
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
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, repoContext, t]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const executeItem = useCallback(
    async (item: PaletteResult) => {
      if (isCommandItem(item)) {
        if (item.action === "theme") {
          toggleTheme();
          close();
          return;
        }

        if (item.action === "focus" && item.value) {
          setFocusMode(item.value);
          close();
          return;
        }

        if (item.href) {
          if (item.href.startsWith("/api/")) {
            window.location.href = item.href;
            close();
            return;
          }

          router.push(item.href);
          close();
        }

        return;
      }

      router.push(item.href);
      close();
    },
    [close, router, toggleTheme],
  );

  const executeActive = useCallback(() => {
    const item = items[activeIndex];

    if (item) {
      void executeItem(item);
    }
  }, [activeIndex, executeItem, items]);

  return {
    activeIndex,
    close,
    commands: visibleCommands,
    error,
    executeActive,
    executeItem,
    getResultId,
    items,
    loading,
    open,
    query,
    repoContext,
    searchResponse,
    searchResults,
    setActiveIndex,
    setOpen,
    setQuery,
  };
}
