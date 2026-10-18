import "@/components/dashboard/dashboard-backdrop.css";

/**
 * The dashboard's backdrop: a slow aurora in the brand's navy, turquoise and
 * cyan, with faint contour lines over it, like a topographic map of the
 * session. Everything is low contrast and moves on cycles of a minute or more,
 * so it gives the desk depth without pulling the eye off the numbers. Pure CSS
 * and SVG, server-rendered; it stands still for reduced motion.
 */

/** One closed contour ring: a circle pushed in and out by two slow waves. */
function ring(cx: number, cy: number, radius: number, k: number, points = 120) {
  let d = "";
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (1 + 0.085 * Math.sin(3 * a + k * 0.7) + 0.045 * Math.sin(5 * a - k * 1.3) + 0.02 * Math.sin(9 * a + k));
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a) * 0.78;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

const PEAK = Array.from({ length: 15 }, (_, i) => ring(0, 0, 36 + i * 46, i + 1));
const VALLEY = Array.from({ length: 10 }, (_, i) => ring(0, 0, 28 + i * 40, i + 4));

export function DashboardBackdrop() {
  return (
    <div aria-hidden className="dash-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="dash-aurora dash-aurora--a" />
      <div className="dash-aurora dash-aurora--b" />
      <div className="dash-aurora dash-aurora--c" />
      <svg className="dash-contours" viewBox="-800 -500 1600 1000" preserveAspectRatio="xMidYMid slice">
        <g className="dash-contours__peak">
          {PEAK.map((d, i) => <path key={i} d={d} style={{ opacity: 1 - i * 0.045 }} />)}
        </g>
        <g className="dash-contours__valley">
          {VALLEY.map((d, i) => <path key={i} d={d} style={{ opacity: 1 - i * 0.07 }} />)}
        </g>
      </svg>
      <div className="dash-grain" />
    </div>
  );
}
