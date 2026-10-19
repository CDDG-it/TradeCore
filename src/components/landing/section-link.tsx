"use client";

import type { ComponentProps, MouseEvent } from "react";
import { landingSectionId, scrollToSection } from "@/lib/landing/scroll-to-section";

/**
 * Product links on the landing page scroll to their section with the header taken
 * into account (see scrollToSection); from any other page they navigate as usual
 * and the landing page lines the section up once it has loaded.
 */
export function sectionLinkClick(href: string, close?: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    const id = landingSectionId(href);
    if (!id || window.location.pathname !== "/" || !document.getElementById(id)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    close?.();
    // Let the menu close (and the page unlock its scroll) before measuring.
    window.setTimeout(() => scrollToSection(id), 0);
  };
}

/** A plain in-page link to a landing section, e.g. a hero CTA. */
export function SectionLink({ href, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  const scroll = sectionLinkClick(href);
  return <a href={href} onClick={(event) => { onClick?.(event); scroll(event); }} {...props} />;
}
