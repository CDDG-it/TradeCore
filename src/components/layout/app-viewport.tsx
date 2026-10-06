"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Keeps the app itself fixed; long views are reached one viewport at a time. */
export function AppViewport({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [pageState, setPageState] = useState({ path: pathname, index: 0 });
  const page = pageState.path === pathname ? pageState.index : 0;
  const [metrics, setMetrics] = useState({ count: 1, step: 0, last: 0 });

  useEffect(() => {
    const frame = viewport.current;
    const body = content.current;
    if (!frame || !body) return;
    const measure = () => {
      const height = frame.clientHeight;
      const total = body.scrollHeight;
      const step = Math.max(1, height - (total > height + 2 ? 44 : 0));
      const count = Math.max(1, Math.ceil(total / step));
      setMetrics({ count, step, last: Math.max(0, total - step) });
      setPageState((current) => ({ path: pathname, index: Math.min(current.path === pathname ? current.index : 0, count - 1) }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(body);
    const mutation = new MutationObserver(measure);
    mutation.observe(body, { childList: true, subtree: true, characterData: true });
    measure();
    return () => { observer.disconnect(); mutation.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    const frame = viewport.current;
    if (!frame) return;
    const innerPane = (target: EventTarget | null) => {
      let node = target instanceof HTMLElement ? target : null;
      while (node && node !== frame) {
        const overflow = getComputedStyle(node).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 2) return node;
        node = node.parentElement;
      }
      return null;
    };
    const turn = (target: EventTarget | null, direction: number) => {
      const pane = innerPane(target);
      if (pane) {
        pane.scrollTo({ top: pane.scrollTop + direction * Math.max(1, pane.clientHeight - 32), behavior: "instant" });
        return;
      }
      setPageState((current) => {
        const index = Math.max(0, Math.min(metrics.count - 1, (current.path === pathname ? current.index : 0) + direction));
        return current.path === pathname && current.index === index ? current : { path: pathname, index };
      });
    };
    let lastWheelTurn = 0;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) < 2 || Date.now() - lastWheelTurn < 280) return;
      lastWheelTurn = Date.now();
      turn(event.target, event.deltaY > 0 ? 1 : -1);
    };
    let touchY = 0;
    const touchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0; };
    const touchMove = (event: TouchEvent) => event.preventDefault();
    const touchEnd = (event: TouchEvent) => {
      const delta = touchY - (event.changedTouches[0]?.clientY ?? touchY);
      if (Math.abs(delta) > 40) turn(event.target, delta > 0 ? 1 : -1);
    };
    frame.addEventListener("wheel", wheel, { passive: false, capture: true });
    frame.addEventListener("touchstart", touchStart, { passive: true, capture: true });
    frame.addEventListener("touchmove", touchMove, { passive: false, capture: true });
    frame.addEventListener("touchend", touchEnd, true);
    const stopKeys = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement) || event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "PageDown" || event.key === "PageUp") { event.preventDefault(); turn(event.target, event.key === "PageDown" ? 1 : -1); }
    };
    frame.addEventListener("keydown", stopKeys, true);
    return () => { frame.removeEventListener("wheel", wheel, true); frame.removeEventListener("touchstart", touchStart, true); frame.removeEventListener("touchmove", touchMove, true); frame.removeEventListener("touchend", touchEnd, true); frame.removeEventListener("keydown", stopKeys, true); };
  }, [metrics.count, pathname]);

  const offset = Math.min(page * metrics.step, metrics.last);
  useEffect(() => {
    viewport.current?.scrollTo({ top: offset, behavior: "instant" });
  }, [offset, pathname]);
  return <div className="relative h-full min-h-0 overflow-hidden" data-app-viewport>
    <div ref={viewport} className="h-full min-h-0 overflow-hidden">
      <div ref={content} className="min-h-full">{children}</div>
    </div>
    {metrics.count > 1 && <div className="absolute bottom-1 right-1 z-30 flex items-center gap-2 rounded-lg border border-border/70 bg-background/95 px-2 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md">
      <button type="button" disabled={page === 0} onClick={() => setPageState({ path: pathname, index: page - 1 })} className="text-primary disabled:opacity-30">Previous</button>
      <span className="tabular-nums text-muted-foreground">{page + 1}/{metrics.count}</span>
      <button type="button" disabled={page === metrics.count - 1} onClick={() => setPageState({ path: pathname, index: page + 1 })} className="text-primary disabled:opacity-30">Next</button>
    </div>}
  </div>;
}
