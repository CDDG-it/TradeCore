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
          <path d="m12 2.75 8 5.1v8.3l-8 5.1-8-5.1v-8.3l8-5.1Z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
          <path d="m7.5 14.5 3.2-3.5 2.2 1.8 3.6-3.9" />
          <path d="M13.8 8.9h2.7v2.7" />
        </svg>
      );
    case "/trade-therapist":
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
          <path d="M4.5 12h3.1l2.1-3.4 3.1 6.5 2-3.1h4.7" />
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
