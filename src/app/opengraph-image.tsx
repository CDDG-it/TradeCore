import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The card that shows up when the site is pasted into a message, a post or a
 * chat. Generated rather than exported as a flat PNG, so it stays in step with
 * the palette and the wording instead of drifting the moment either changes.
 *
 * Drawn with the same vocabulary as the landing page: navy ground, a plotting
 * grid, two soft turquoise and cyan glows, and a row of candles along the base.
 * The candles are a deterministic decorative series — no figure here claims to
 * be a market or a result.
 */
export const alt = "TradingMC — where self-improvement meets trading";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0B1120";
const TURQUOISE = "#14B8A6";

// The app mark, inlined: satori resolves no relative URLs of its own.
const MARK = `data:image/svg+xml;base64,${readFileSync(
  join(process.cwd(), "public", "tradingmc-app-dark.svg")
).toString("base64")}`;

/** The band the candles are drawn into, in pixels. */
const BAND = 230;

/**
 * A fixed pseudo-random walk, normalised into the band so the field always
 * fills it — the same series every build, and never running off the edge.
 */
function candles(n: number) {
  let s = 1337;
  const rand = () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
  let price = 100;
  const walk = Array.from({ length: n }, () => {
    const open = price;
    const close = price + (rand() - 0.44) * 26;
    price = close;
    return { open, close, bull: close >= open };
  });

  const lo = Math.min(...walk.map((c) => Math.min(c.open, c.close)));
  const hi = Math.max(...walk.map((c) => Math.max(c.open, c.close)));
  const scale = (v: number) => ((v - lo) / (hi - lo || 1)) * (BAND - 24);

  return walk.map((c) => {
    const top = scale(Math.max(c.open, c.close));
    const bottom = scale(Math.min(c.open, c.close));
    return { height: Math.max(10, top - bottom), lift: bottom, bull: c.bull };
  });
}

export default function OpengraphImage() {
  const bars = candles(26);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NAVY,
          position: "relative",
        }}
      >
        {/* Ground: two glows, each in its own layer. Satori renders one
            gradient per element reliably; stacked comma-separated ones do not
            survive, which is how the first draft came out flat navy. */}
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -180,
            width: 900,
            height: 700,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(20,184,166,0) 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -200,
            bottom: -220,
            width: 860,
            height: 700,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(6,182,212,0) 62%)",
          }}
        />

        {/* Identity */}
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 72px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <img src={MARK} width={104} height={104} alt="" />
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: "-0.03em" }}>
              <span style={{ color: "#F8FAFC" }}>Trading</span>
              <span style={{ color: TURQUOISE }}>MC</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 780,
              fontSize: 34,
              lineHeight: 1.35,
              color: "rgba(248,250,252,0.72)",
            }}
          >
            Where self-improvement meets trading.
          </div>
        </div>

        {/* The series sits between the line and the labels, so nothing overlaps
            and the middle of the card is not empty. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            height: BAND,
            padding: "0 72px",
          }}
        >
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 26,
                height: Math.round(b.height),
                marginBottom: Math.round(b.lift),
                background: b.bull ? "rgba(20,184,166,0.26)" : "rgba(100,116,139,0.20)",
                border: `2px solid ${b.bull ? "rgba(20,184,166,0.75)" : "rgba(100,116,139,0.5)"}`,
                borderRadius: 3,
              }}
            />
          ))}
        </div>

        {/* What the desk actually holds, in its own words. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "28px 72px 56px",
          }}
        >
          {["Journal", "Analytics", "My Edge", "Trade Therapist", "Global Markets"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                border: "2px solid rgba(20,184,166,0.35)",
                background: "rgba(20,184,166,0.10)",
                color: "rgba(248,250,252,0.86)",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
