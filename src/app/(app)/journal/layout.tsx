import type { CSSProperties, ReactNode } from "react";
import { Inter } from "next/font/google";

/**
 * The journal wears the homepage typeface. Inter is the public site's font
 * (see `.marketing-page` in globals.css); the rest of the signed-in app uses
 * Barlow / Nunito. Loading Inter here rather than in the root layout keeps it
 * off every other page's critical path: only the journal routes pull it.
 *
 * The wrapper redefines the app's font tokens for its subtree, so body copy and
 * headings alike resolve to Inter without touching any of the journal's markup.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function JournalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={inter.variable}
      style={{
        "--font-body": "var(--font-inter)",
        "--font-sans": "var(--font-inter)",
        "--font-heading": "var(--font-inter)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      } as CSSProperties}
    >
      {children}
    </div>
  );
}
