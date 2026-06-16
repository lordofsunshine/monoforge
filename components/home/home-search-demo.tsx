"use client";

import { useEffect, useRef } from "react";
import { LocalizedText } from "@/components/system/localized-text";

const query = "lordofsunshine/monoforge";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function HomeSearchDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const repoWrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const typed = typedRef.current;
    const caret = caretRef.current;
    const search = searchRef.current;
    const panel = panelRef.current;
    const result = resultRef.current;
    const repoWrap = repoWrapRef.current;
    const cursor = cursorRef.current;

    if (!root || !stage || !typed || !caret || !search || !panel || !result || !repoWrap || !cursor) {
      return;
    }

    const demo = { root, stage, typed, caret, search, panel, result, repoWrap, cursor };
    let active = true;
    let running = false;
    let visible = false;
    let visibleResolvers: Array<() => void> = [];

    function waitForVisible() {
      if (visible || !active) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        visibleResolvers.push(resolve);
      });
    }

    function resetDemo() {
      demo.typed.textContent = "";
      demo.caret.classList.remove("off");
      demo.search.classList.remove("active");
      demo.panel.classList.remove("show");
      demo.stage.classList.remove("panel-open");
      demo.result.classList.remove("hover", "click");
      demo.repoWrap.classList.remove("show");
      demo.cursor.classList.remove("show", "move", "press");
      demo.cursor.style.left = "0px";
      demo.cursor.style.top = "0px";
    }

    function pointTo(el: HTMLElement, offsetX: number, offsetY: number) {
      const stageRect = demo.stage.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return { x: rect.left - stageRect.left + offsetX, y: rect.top - stageRect.top + offsetY };
    }

    function moveCursor(x: number, y: number) {
      demo.cursor.classList.add("move");
      demo.cursor.style.left = `${x}px`;
      demo.cursor.style.top = `${y}px`;
    }

    async function typeQuery() {
      for (let i = 0; i < query.length; i += 1) {
        if (!active || !visible) return;
        demo.typed.textContent = query.slice(0, i + 1);
        await wait(88);
      }
    }

    async function eraseQuery() {
      const len = demo.typed.textContent?.length ?? 0;
      for (let j = len; j > 0; j -= 1) {
        if (!active || !visible) return;
        demo.typed.textContent = query.slice(0, j - 1);
        await wait(52);
      }
    }

    async function playCycle() {
      resetDemo();
      await wait(1100);
      if (!active || !visible) return;

      demo.search.classList.add("active");
      await typeQuery();
      if (!active || !visible) return;
      await wait(650);

      demo.panel.classList.add("show");
      demo.stage.classList.add("panel-open");
      await wait(900);
      if (!active || !visible) return;

      const from = pointTo(demo.search, 120, 22);
      const target = pointTo(demo.result, 36, 20);
      demo.cursor.classList.add("show");
      demo.cursor.style.left = `${from.x}px`;
      demo.cursor.style.top = `${from.y}px`;
      await wait(280);
      if (!active || !visible) return;
      moveCursor(target.x, target.y);
      await wait(1150);
      if (!active || !visible) return;

      demo.result.classList.add("hover");
      await wait(420);
      demo.cursor.classList.add("press");
      demo.result.classList.add("click");
      await wait(240);
      demo.cursor.classList.remove("press");
      demo.result.classList.remove("hover", "click");

      demo.panel.classList.remove("show");
      demo.stage.classList.remove("panel-open");
      demo.caret.classList.add("off");
      await wait(620);
      if (!active || !visible) return;
      demo.repoWrap.classList.add("show");
      demo.cursor.classList.remove("show", "move");
      await wait(3400);
      if (!active || !visible) return;

      demo.repoWrap.classList.remove("show");
      await wait(700);
      demo.caret.classList.remove("off");
      await eraseQuery();
      if (!active || !visible) return;
      await wait(400);
      demo.search.classList.remove("active");
      await wait(1200);
    }

    async function runDemo() {
      if (running) return;
      running = true;

      while (active) {
        await waitForVisible();
        if (!active) break;
        await playCycle();
      }

      running = false;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;

        if (isVisible === visible) {
          return;
        }

        visible = isVisible;

        if (visible) {
          const resolvers = visibleResolvers;
          visibleResolvers = [];
          resolvers.forEach((resolve) => resolve());
          if (!running) {
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                if (active) {
                  void runDemo();
                }
              });
            });
          }
        } else {
          resetDemo();
        }
      },
      { threshold: 0.15 },
    );

    resetDemo();
    observer.observe(demo.root);

    return () => {
      active = false;
      visible = false;
      const resolvers = visibleResolvers;
      visibleResolvers = [];
      resolvers.forEach((resolve) => resolve());
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="overflow-visible rounded-2xl border border-line bg-surface/[0.96] p-7 shadow-2xl shadow-black/[0.08] backdrop-blur">
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-secondary">
        <LocalizedText path="home.searchTitle" />
      </h2>
      <p className="mt-3 text-[0.92rem] leading-[1.55] text-secondary">
        <LocalizedText path="home.searchText" />
      </p>
      <p className="mt-4 flex flex-wrap items-center gap-x-0 font-mono text-[0.78rem] text-faint">
        {(["home.stripOne", "home.stripTwo", "home.stripThree", "home.stripFour", "home.stripFive"] as const).map((path) => (
          <span className="inline-flex items-center gap-2 after:opacity-45 last:after:content-none after:content-['·']" key={path}>
            <LocalizedText path={path} />
          </span>
        ))}
      </p>
      <div ref={stageRef} className="mf-home-demo-stage relative mt-5 overflow-visible">
        <div className="relative z-[5] shrink-0">
          <div
            ref={searchRef}
            className="mf-home-demo-search flex items-center gap-3 rounded-[0.6rem] border border-line bg-background px-4 py-3.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="flex min-h-[1.35rem] flex-1 items-center overflow-hidden whitespace-nowrap text-[0.92rem] text-foreground">
              <span ref={typedRef} />
              <span ref={caretRef} className="mf-home-demo-caret" />
            </span>
            <kbd className="rounded-[0.3rem] border border-line px-1.5 py-0.5 font-mono text-xs text-faint">Ctrl K</kbd>
          </div>
          <div ref={panelRef} className="mf-home-demo-panel absolute inset-x-0 top-[calc(100%+0.5rem)] z-[6]">
            <div ref={resultRef} className="mf-home-demo-result grid gap-1.5 rounded-[0.65rem] border border-line bg-surface px-4 py-3.5 shadow-2xl shadow-black/[0.12]">
              <span className="font-mono text-[0.82rem] text-secondary">
                <b className="font-semibold text-foreground">monoforge</b> by lordofsunshine
              </span>
              <span className="text-[0.82rem] leading-[1.45] text-faint">
                <LocalizedText path="home.demoResultDesc" />
              </span>
            </div>
          </div>
        </div>
        <div ref={repoWrapRef} className="mf-home-demo-repo-wrap">
          <div className="mf-home-demo-repo grid content-start gap-3 rounded-xl border border-line bg-background p-4">
            <div className="mf-home-sk-line w-[55%]" />
            <div className="mf-home-sk-line w-[40%]" />
            <div className="mf-home-sk-line w-[70%]" />
            <div className="grid gap-2 border-t border-line pt-2">
              <div className="mf-home-sk-line w-[90%]" />
              <div className="mf-home-sk-line w-[70%]" />
              <div className="mf-home-sk-line mf-home-sk-tall" />
              <div className="mf-home-sk-line w-[55%]" />
            </div>
          </div>
        </div>
        <div ref={cursorRef} className="mf-home-demo-cursor pointer-events-none absolute left-0 top-0 z-20 opacity-0" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 3L19 12L11 13.5L9 21L5 3Z" fill="currentColor" stroke="rgb(var(--mf-bg))" strokeWidth="1.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
