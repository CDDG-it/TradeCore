"use client";

import { useEffect, useRef, useState } from "react";

/** Shared visibility rule for navigation on the page and in scrolling desks. */
export function useScrollNav(keepVisible = false) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const positions = useRef(new WeakMap<EventTarget, number>());

  useEffect(() => {
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Document || target instanceof Element)) return;
      const top = target instanceof Document ? (target.scrollingElement?.scrollTop ?? window.scrollY) : target.scrollTop;
      const previous = positions.current.get(target) ?? top;
      positions.current.set(target, top);
      if (target instanceof Document) setScrolled(top > 8);
      if (top < 24 || top < previous - 8) setVisible(true);
      else if (top > previous + 10) setVisible(false);
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  return { visible: visible || keepVisible, scrolled, show: () => setVisible(true) };
}
