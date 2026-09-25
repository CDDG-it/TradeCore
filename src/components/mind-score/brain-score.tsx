import Image from "next/image";
import { cn } from "@/lib/utils";

/** The My Edge mark in a quiet state and a score-filled state. */
export function BrainScore({ score, className }: {
  score: number | null;
  className?: string;
}) {
  const amount = Math.max(0, Math.min(100, score ?? 0));
  // The artwork has transparent space above and below the shield. Fill within
  // the shield's visible bounds, rather than the complete PNG, so 74 reads as
  // 74% of the icon instead of a nearly full mark.
  const visibleTop = 13;
  const visibleBottom = 90;
  const clipTop = visibleBottom - (amount / 100) * (visibleBottom - visibleTop);
  // Keep the sculpted shading while shifting the blue asset into the score band.
  const hueShift = amount < 20 ? 185 : amount < 40 ? 225 : amount < 60 ? 245 : amount < 80 ? 0 : -35;
  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      role="img"
      aria-label={score === null ? "Mindscore has no reading yet" : `My Edge icon filled to reflect a Mindscore of ${score}`}
    >
      <Image src="/product-icons/edge-glass-v2.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain grayscale opacity-[.08]" />
      <div className="absolute inset-0 transition-[clip-path] duration-700 ease-out" style={{ clipPath: `inset(${clipTop}% 0 0 0)` }} aria-hidden="true">
        <Image src="/product-icons/edge-glass-v2.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain transition-[filter] duration-700" style={{ filter: `brightness(.82) saturate(.95) hue-rotate(${hueShift}deg)` }} />
      </div>
    </div>
  );
}
