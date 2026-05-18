"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteLineLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pulse(duration = 650) {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), duration);
  }

  useEffect(() => {
    pulse(500);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a") : null;

      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      if (target.target || target.hasAttribute("download") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const url = new URL(target.href, window.location.href);

      if (url.origin === window.location.origin && url.href !== window.location.href) {
        pulse(1400);
      }
    }

    function onSubmit() {
      pulse(1600);
    }

    function onPopState() {
      pulse(900);
    }

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <div aria-hidden="true" className={`fixed left-0 top-0 z-[70] h-px w-full overflow-hidden bg-transparent transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="mf-route-loader-line h-full w-1/2 bg-foreground" />
    </div>
  );
}
