/**
 * In-page product links on the landing page. A plain `#anchor` jump with a fixed
 * scroll margin lands wrong here: the sticky header hides while you scroll down
 * and comes back while you scroll up, so a fixed gap either leaves a strip of
 * the previous section above the target or tucks the heading under the header.
 * This lands the section's top edge exactly at the top of what you can see.
 */

/** The landing section id an href points at, when it points at one on the landing page. */
export function landingSectionId(href: string) {
  const match = /^\/?#([\w-]+)$/.exec(href);
  return match ? match[1] : null;
}

export function scrollToSection(id: string, { updateHash = true, instant = false } = {}) {
  const section = document.getElementById(id);
  if (!section) return false;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = window.scrollY;
  // The hero opens the page, so it lands at the very top.
  let top = id === "dashboard" ? 0 : section.getBoundingClientRect().top + current;
  // Scrolling up brings the header back: keep the section's top edge below it.
  if (top < current && top > 0) top -= document.querySelector("header")?.getBoundingClientRect().height ?? 0;

  window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: instant || reduceMotion ? "instant" : "smooth" });
  if (updateHash && window.location.hash !== `#${id}`) window.history.pushState(null, "", `/#${id}`);
  return true;
}
