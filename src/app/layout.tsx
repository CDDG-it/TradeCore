import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Barlow, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "block",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "block",
});

/**
 * `metadataBase` is what turns the relative OG image path into the absolute URL
 * every scraper needs. It comes from the deployment's own site URL, with the
 * production domain as the fallback so a preview build without the variable
 * still produces working tags rather than silently dropping the card.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tradinghub-lovat.vercel.app";

const TITLE = "TradingMC — where self-improvement meets trading";
const DESCRIPTION =
  "A trading desk for futures traders who work on themselves as seriously as on their entries. " +
  "Journal every trade, read your own numbers, hold your habits, and see what is moving the market.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // Pages that set their own title get "· TradingMC" appended; everything else
  // falls back to the full line.
  title: { default: TITLE, template: "%s · TradingMC" },
  description: DESCRIPTION,
  applicationName: "TradingMC",
  openGraph: {
    type: "website",
    siteName: "TradingMC",
    url: SITE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // The app itself sits behind a login, so there is nothing there for a crawler
  // to index; the public pages are the landing, terms, privacy and features.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The inline script below writes `class` and `color-scheme` onto this
      // element before React hydrates, so the server's markup deliberately
      // does not match. Suppressing the warning here is the standard theme-
      // script pattern; it covers this element's own attributes only.
      suppressHydrationWarning

      // globals.css sets `scroll-behavior: smooth` for the landing page's anchor
      // links. Next needs to be told about it, otherwise it leaves smooth
      // scrolling on for its own scroll-to-top after a route change and every
      // navigation animates the old page sliding upward first.
      data-scroll-behavior="smooth"
      className={`${geistMono.variable} ${instrumentSerif.variable} ${barlow.variable} ${nunito.variable} h-full antialiased`}
    >
      <head>
        {/*
          Paint the stored theme before the first frame. Without this the
          server always renders dark and the class is only corrected in an
          effect, so anyone on light — or on "system" during the day — gets a
          navy flash on every page load. It has to be inline and blocking to
          run ahead of paint, which is why it is a raw script rather than a
          component.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem("th_theme");var light=p==="light"||(p==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches);var r=document.documentElement;if(light){r.classList.add("light");}r.style.colorScheme=light?"light":"dark";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
