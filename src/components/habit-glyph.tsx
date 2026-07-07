import {
  Pencil,
  LineChart,
  Search,
  Dumbbell,
  Brain,
  BookOpen,
  Moon,
  Footprints,
  Droplets,
  Coffee,
  Sun,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

// Custom icon set for habits (replaces the generic emoji picker). A habit's
// `icon` field stores one of these keys; legacy emoji values still render as a
// fallback so older habits keep showing something sensible.
type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

export const HABIT_ICONS: { key: string; Icon: IconComponent }[] = [
  { key: "journal", Icon: Pencil },
  { key: "markets", Icon: LineChart },
  { key: "research", Icon: Search },
  { key: "workout", Icon: Dumbbell },
  { key: "mindset", Icon: Brain },
  { key: "reading", Icon: BookOpen },
  { key: "sleep", Icon: Moon },
  { key: "walk", Icon: Footprints },
  { key: "hydrate", Icon: Droplets },
  { key: "routine", Icon: Coffee },
  { key: "morning", Icon: Sun },
  { key: "checklist", Icon: CheckCircle2 },
];

export const HABIT_ICON_MAP: Record<string, IconComponent> = {
  ...Object.fromEntries(HABIT_ICONS.map((h) => [h.key, h.Icon])),
  // Legacy habits created before the bullseye icon was retired map to a
  // neutral figure instead of rendering a stray key or emoji.
  goal: Sparkles,
  "🎯": Sparkles,
};

/** Renders a habit's chosen figure, falling back to the raw value (e.g. an old emoji). */
export function HabitGlyph({
  icon,
  className,
  style,
}: {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = HABIT_ICON_MAP[icon];
  if (Icon) return <Icon className={className} style={style} />;
  return <span className={className} style={style}>{icon || "•"}</span>;
}
