import Image from "next/image";
import { cn } from "@/lib/utils";

/** The same sculpted brain in a quiet state and a score-filled state. */
export function BrainScore({ score, color, className }: {
  score: number | null;
  color: string;
  className?: string;
}) {
  const amount = Math.max(0, Math.min(100, score ?? 0));
  // Keep the sculpted shading while shifting the blue asset into the score band.
  const hueShift = amount < 20 ? 185 : amount < 40 ? 225 : amount < 60 ? 245 : amount < 80 ? 0 : -35;
  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      role="img"
      aria-label={score === null ? "Mindscore has no reading yet" : `Brain filled to reflect a Mindscore of ${score}`}
    >
      <div className="pointer-events-none absolute inset-[20%] rounded-full blur-2xl" style={{ background: `color-mix(in oklch, ${color} 24%, transparent)` }} />
      <Image src="/product-icons/brain-teal.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain grayscale opacity-30" />
      <div className="absolute inset-0 transition-[clip-path] duration-700 ease-out" style={{ clipPath: `inset(${100 - amount}% 0 0 0)` }} aria-hidden="true">
        <Image src="/product-icons/brain-teal.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain transition-[filter] duration-700" style={{ filter: `hue-rotate(${hueShift}deg)` }} />
      </div>
    </div>
  );
}
