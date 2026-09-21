# TradingMC — Brand / Design System

The single source of truth for the TradingMC visual identity. Tokens live in
[`src/app/globals.css`](src/app/globals.css); this file is the human-readable
summary. When building anything for TradingMC, apply this — it overrides any
default/"Claude" styling.

Interactive version (click-to-copy swatches, logo, specimens):
Claude artifact **TradingMC Brand Kit** — https://claude.ai/artifact/6AmVxGwfUa4DSTp7Mb2DMt

## Logo
- Mark: transparent PNG at [`public/tradingmc-logo.png`](public/tradingmc-logo.png) — turquoise→cyan interlocking monogram.
- Used in the landing nav and the signed-in top bar, always linking to `/` (home).
- Wordmark: **Trading** in foreground + **MC** in turquoise, set in Clash Display.
- Keep clear space ≈ half the mark's height. Never recolor, outline, add shadow, or stretch it — scale uniformly.

## Colour (dark-first, navy-grounded)
| Role | Token | Hex |
|---|---|---|
| Background / sidebar | `--background` | `#0B1120` |
| Card / panel | `--card` | `#131B2E` |
| Elevated / border / muted | `--popover` / `--border` | `#1C2740` |
| **Primary — turquoise** | `--primary` | `#14B8A6` |
| **Accent — cyan** (data & AI) | `--ice` | `#06B6D4` |
| Accent text on navy | — | `#6AD5C9` |
| Text | `--foreground` | `#F8FAFC` |
| Secondary text | `--secondary-foreground` | `#CBD5E1` |
| Muted text / labels | `--muted-foreground` | `#64748B` |
| Win / positive | `--win` / `--success` | `#22C55E` |
| Loss / negative | `--loss` / `--destructive` | `#EF4444` |
| Break-even / warning (amber) | `--be` / `--warning` | `#EAB308` |

MC Mindscore ramp (off the rails → dialled in): `#EF4444 · #F59E0B · #EAB308 · #14B8A6 · #22C55E`.

**No orange, anywhere.** Break-even is amber `#EAB308`, not orange.

## Type
- **Display / headlines** — Clash Display (Fontshare), 500/600/700, tight tracking (`-0.06em`), leading ~0.98.
- **Body / UI** — Barlow (`--font-body`); Inter on the landing page.
- **Mono / tokens, labels, figures** — Geist Mono (`--font-mono`); use `tabular-nums` for aligned digits.

## Feel & rules
- Luxury-minimal dark fintech: roomy, sharp type, subtle motion, no clutter or cheap-template feel. A real product, never a demo. Mobile responsive.
- One accent (turquoise), cyan for data/AI; semantic colours reserved for meaning.
- Base radius `0.75rem`, scaling up on larger surfaces; turquoise focus ring (2px, 3px offset).
- Copy: no em dashes, en dashes or ellipsis characters — plain hyphens and periods. Active voice; a control says exactly what it does.
