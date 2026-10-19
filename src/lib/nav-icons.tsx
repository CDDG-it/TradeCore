import type { SVGProps } from "react";

type NavIconProps = SVGProps<SVGSVGElement> & { href: string; active?: boolean };

/** Small, single-weight symbols shared by the desktop rail and phone tab bar. */
export function NavIcon({ href, active = false, ...props }: NavIconProps) {
  const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    ...props,
  };

  switch (href) {
    case "/dashboard":
      return (
        <svg {...base}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        </svg>
      );
    case "/psychological-edge":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" opacity={active ? 1 : 0.7} />
        </svg>
      );
    case "/trade-therapist":
      return (
        <svg {...base}>
          <path d="M20.25 11.5a8.25 8.25 0 0 1-8.25 8.25 8.4 8.4 0 0 1-3.1-.59L4 20l.84-4.9A8.25 8.25 0 1 1 20.25 11.5Z" />
          <path d="M8.4 10h7.2M8.4 13.5h4.8" />
        </svg>
      );
    case "/news-city":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.3 2.25 3.5 5.1 3.5 8.5s-1.2 6.25-3.5 8.5M12 3.5C9.7 5.75 8.5 8.6 8.5 12s1.2 6.25 3.5 8.5" />
        </svg>
      );
    default:
      return null;
  }
}
