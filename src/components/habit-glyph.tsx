import {
  Pencil, LineChart, Search, Dumbbell, Brain, BookOpen, Moon, Footprints, Droplets, Coffee, Sun, CheckCircle2, Sparkles,
  ChartCandlestick, ShieldCheck, Scale, ListChecks, NotebookPen, Newspaper, Gauge, Crosshair,
  Wind, Focus, Waves, HandHeart, Lightbulb, PhoneOff, MonitorOff, Anchor,
  Bike, Salad, HeartPulse, BedDouble, Activity, Sprout,
  Sunrise, AlarmClock, Timer, CalendarCheck, GraduationCap, Headphones, Hourglass, Trophy,
} from "lucide-react";

// Custom icon set for habits (replaces the generic emoji picker). A habit's
// `icon` field stores one of these keys; legacy emoji values still render as a
// fallback so older habits keep showing something sensible.
type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
export interface HabitIcon { key: string; label: string; Icon: IconComponent }

/**
 * The picker, grouped by what the habit is about. The first twelve keys are the
 * original set (journal ... checklist) and keep their meaning, so stored habits
 * render exactly as before.
 */
export const HABIT_ICON_GROUPS: { label: string; icons: HabitIcon[] }[] = [
  {
    label: "At the screen",
    icons: [
      { key: "journal", label: "Journal", Icon: Pencil },
      { key: "markets", label: "Markets", Icon: LineChart },
      { key: "candles", label: "Charts", Icon: ChartCandlestick },
      { key: "research", label: "Research", Icon: Search },
      { key: "plan", label: "Trade plan", Icon: ListChecks },
      { key: "checklist", label: "Checklist", Icon: CheckCircle2 },
      { key: "risk", label: "Risk", Icon: ShieldCheck },
      { key: "size", label: "Position size", Icon: Scale },
      { key: "levels", label: "Key levels", Icon: Crosshair },
      { key: "news", label: "News", Icon: Newspaper },
      { key: "review", label: "Review", Icon: NotebookPen },
      { key: "limits", label: "Daily limit", Icon: Gauge },
    ],
  },
  {
    label: "Mind",
    icons: [
      { key: "mindset", label: "Mindset", Icon: Brain },
      { key: "breathe", label: "Breathing", Icon: Wind },
      { key: "focus", label: "Focus", Icon: Focus },
      { key: "calm", label: "Calm", Icon: Waves },
      { key: "grounded", label: "Grounded", Icon: Anchor },
      { key: "gratitude", label: "Gratitude", Icon: HandHeart },
      { key: "idea", label: "Ideas", Icon: Lightbulb },
      { key: "no-phone", label: "No phone", Icon: PhoneOff },
      { key: "screens-off", label: "Screens off", Icon: MonitorOff },
    ],
  },
  {
    label: "Body",
    icons: [
      { key: "workout", label: "Workout", Icon: Dumbbell },
      { key: "walk", label: "Walk", Icon: Footprints },
      { key: "cardio", label: "Cardio", Icon: Activity },
      { key: "bike", label: "Ride", Icon: Bike },
      { key: "hydrate", label: "Water", Icon: Droplets },
      { key: "food", label: "Eat well", Icon: Salad },
      { key: "heart", label: "Heart rate", Icon: HeartPulse },
      { key: "sleep", label: "Sleep", Icon: Moon },
      { key: "rest", label: "Rest", Icon: BedDouble },
    ],
  },
  {
    label: "The day",
    icons: [
      { key: "morning", label: "Morning", Icon: Sun },
      { key: "sunrise", label: "Early start", Icon: Sunrise },
      { key: "routine", label: "Routine", Icon: Coffee },
      { key: "alarm", label: "Alarm", Icon: AlarmClock },
      { key: "timer", label: "Timer", Icon: Timer },
      { key: "wait", label: "Patience", Icon: Hourglass },
      { key: "calendar", label: "Calendar", Icon: CalendarCheck },
      { key: "reading", label: "Reading", Icon: BookOpen },
      { key: "study", label: "Study", Icon: GraduationCap },
      { key: "podcast", label: "Listen", Icon: Headphones },
      { key: "growth", label: "Growth", Icon: Sprout },
      { key: "win", label: "Milestone", Icon: Trophy },
    ],
  },
];

/** Every icon, flat, in picker order. */
export const HABIT_ICONS: HabitIcon[] = HABIT_ICON_GROUPS.flatMap((group) => group.icons);

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
  strokeWidth,
}: {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  const Icon = HABIT_ICON_MAP[icon];
  if (Icon) return <Icon className={className} style={style} strokeWidth={strokeWidth} />;
  return <span className={className} style={style}>{icon || "•"}</span>;
}
