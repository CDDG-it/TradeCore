"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { CATEGORY_COLOR_KEY, HABIT_CATEGORIES, HABIT_COLORS, frequencyApplies, habitAccent } from "@/lib/habits";
import { HABIT_ICON_GROUPS, HabitGlyph } from "@/components/habit-glyph";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import type { Habit, HabitCategory, HabitFrequency } from "@/lib/types";

export interface HabitForm {
  name: string;
  description: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  icon: string;
  /** A palette key from HABIT_COLORS. */
  color: string;
}

const EMPTY: HabitForm = { name: "", description: "", category: "routine", frequency: "daily", icon: "checklist", color: CATEGORY_COLOR_KEY.routine };
const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
];
const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** `color-mix` keeps the palette tokens, so the light theme's darker set applies here too. */
const tint = (color: string, pct: number) => `color-mix(in oklch, ${color} ${pct}%, transparent)`;

function formFor(habit: Habit | null): HabitForm {
  if (!habit) return EMPTY;
  const known = HABIT_COLORS.some((c) => c.key === habit.color);
  return {
    name: habit.name,
    description: habit.description ?? "",
    category: habit.category,
    frequency: habit.frequency,
    icon: habit.icon,
    color: known ? habit.color : CATEGORY_COLOR_KEY[habit.category] ?? "slate",
  };
}

/**
 * Creating or editing a habit: the choices on the left (name, what it is
 * about, its colour and figure, how often), and on the right the habit as it
 * will sit in the list, changing as each choice is made. Picking a category
 * also picks its colour until a colour is chosen by hand.
 */
export function HabitComposer({ open, habit, onOpenChange, onSubmit }: {
  open: boolean;
  /** The habit being edited, or null for a new one. */
  habit: Habit | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: HabitForm) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden p-0 sm:max-w-3xl">
        {/* Remounted per open, so every open starts from the habit (or blank). */}
        {open && <Composer key={habit?.id ?? "new"} habit={habit} onCancel={() => onOpenChange(false)} onSubmit={onSubmit} />}
      </DialogContent>
    </Dialog>
  );
}

function Composer({ habit, onCancel, onSubmit }: { habit: Habit | null; onCancel: () => void; onSubmit: (form: HabitForm) => Promise<void> }) {
  const id = useId();
  const [form, setForm] = useState<HabitForm>(() => formFor(habit));
  // Until a colour is picked by hand, it follows the category.
  const [colorChosen, setColorChosen] = useState(Boolean(habit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  // Focus the name without letting the browser scroll the column while the
  // dialog is still zooming in (autoFocus did, and opened it part way down).
  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true });
    if (choices.current) choices.current.scrollTop = 0;
  }, []);
  const accent = habitAccent({ category: form.category, color: form.color });
  const category = HABIT_CATEGORIES.find((c) => c.key === form.category)!;
  const ready = form.name.trim().length > 0;

  function set<K extends keyof HabitForm>(key: K, value: HabitForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function pickCategory(next: HabitCategory) {
    setForm((prev) => ({ ...prev, category: next, color: colorChosen ? prev.color : CATEGORY_COLOR_KEY[next] }));
  }
  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
    } catch {
      setError(`Could not ${habit ? "update" : "create"} the habit. Check your connection and try again.`);
      setSaving(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid max-h-[calc(100dvh-2rem)] grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_17.5rem] md:grid-rows-1">
        {/* ── The choices ─────────────────────────────────────────── */}
        <div ref={choices} className="min-h-0 overflow-y-auto px-5 pb-5 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-heading text-xl font-bold tracking-tight">{habit ? "Edit habit" : "New habit"}</DialogTitle>
            <DialogDescription className="text-xs">Something small you do on purpose, often enough to count.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor={`${id}-name`} className="text-xs font-semibold text-foreground/80">Name</label>
                <input ref={nameRef} id={`${id}-name`} type="text" value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void save(); } }}
                  placeholder="Morning journal"
                  className="h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15" />
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${id}-description`} className="text-xs font-semibold text-foreground/80">Note <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input id={`${id}-description`} type="text" value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Before the open, five lines"
                  className="h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15" />
              </div>
            </div>

            {/* Category: nine tiles, three by three, each in its own colour. */}
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-xs font-semibold text-foreground/80">What it is about</legend>
              <div className="grid grid-cols-3 gap-1.5">
                {HABIT_CATEGORIES.map((c) => {
                  const on = c.key === form.category;
                  const color = habitAccent({ category: c.key });
                  return (
                    <button key={c.key} type="button" aria-pressed={on} onClick={() => pickCategory(c.key)}
                      className={cn("group relative isolate rounded-xl border px-3 py-2.5 text-left transition-[border-color,transform] duration-150 active:scale-[.98]", on ? "border-transparent" : "border-border/60 hover:border-border")}>
                      {on && <motion.span layoutId={`${id}-category`} className="absolute inset-0 -z-10 rounded-xl border" style={{ background: tint(color, 12), borderColor: tint(color, 45) }} transition={SPRING} />}
                      <span className="flex items-center gap-2 text-xs font-semibold" style={on ? { color } : undefined}>
                        <span className="size-2 rounded-full transition-transform duration-200 group-hover:scale-125" style={{ background: color }} />
                        {c.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{c.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Colour: the palette, with the ring sliding to the choice. */}
            <fieldset className="grid gap-2">
              <legend className="mb-2 flex w-full items-center justify-between text-xs font-semibold text-foreground/80">
                Colour
                <span className="font-normal text-muted-foreground">{colorChosen ? HABIT_COLORS.find((c) => c.key === form.color)?.label : `Follows ${category.label}`}</span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {HABIT_COLORS.map((c) => {
                  const on = c.key === form.color;
                  return (
                    <button key={c.key} type="button" aria-label={c.label} aria-pressed={on} title={c.label}
                      onClick={() => { set("color", c.key); setColorChosen(true); }}
                      className="relative grid size-8 place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95">
                      <span className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]" style={{ background: c.value }} />
                      {on && <motion.span layoutId={`${id}-color`} className="absolute inset-0 rounded-full border-2" style={{ borderColor: c.value }} transition={SPRING} />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Figure: grouped, the choice lit in the habit's colour. */}
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-xs font-semibold text-foreground/80">Icon</legend>
              <div className="space-y-3">
                {HABIT_ICON_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">{group.label}</p>
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                      {group.icons.map(({ key, label, Icon }) => {
                        const on = form.icon === key;
                        return (
                          <button key={key} type="button" aria-label={label} aria-pressed={on} title={label} onClick={() => set("icon", key)}
                            className={cn("relative isolate grid aspect-square place-items-center rounded-xl border transition-[border-color,color,transform] duration-150 hover:-translate-y-0.5 active:scale-95", on ? "border-transparent" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}
                            style={on ? { color: accent } : undefined}>
                            {on && <motion.span layoutId={`${id}-icon`} className="absolute inset-0 -z-10 rounded-xl border" style={{ background: tint(accent, 14), borderColor: tint(accent, 45) }} transition={SPRING} />}
                            <Icon className="size-4" strokeWidth={1.75} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-2">
              <p className="text-xs font-semibold text-foreground/80">How often</p>
              <Segmented label="How often" shape="rounded" size="md" value={form.frequency} onChange={(f) => set("frequency", f)}
                className="w-full bg-background/40" buttonClassName="flex-1"
                options={FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))} />
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.p key="error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive"
                  initial={{ opacity: 0, transform: "translateY(-4px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease: EASE_OUT }}>
                  <AlertCircle className="size-3.5 shrink-0" />{error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── The habit, as it will look ──────────────────────────── */}
        {/* On a phone the choices need the height: the preview shrinks to one row above the buttons. */}
        <aside className="relative flex flex-col border-t border-border/60 bg-background/40 p-4 md:border-l md:border-t-0 md:p-5">
          <div aria-hidden className="pointer-events-none absolute inset-0 transition-[background] duration-500" style={{ background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${tint(accent, 14)}, transparent 70%)` }} />
          <p className="relative hidden text-[10px] font-medium text-muted-foreground md:block">Preview</p>

          <div className="relative mt-4 hidden flex-col items-center text-center md:flex">
            <span className="grid size-16 place-items-center rounded-2xl border transition-[background-color,border-color,color,box-shadow] duration-300"
              style={{ background: tint(accent, 14), borderColor: tint(accent, 40), color: accent, boxShadow: `0 12px 34px -14px ${tint(accent, 70)}` }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={form.icon} className="flex" initial={{ opacity: 0, transform: "scale(0.6) rotate(-12deg)" }} animate={{ opacity: 1, transform: "scale(1) rotate(0deg)" }} exit={{ opacity: 0, transform: "scale(0.7)", transition: { duration: 0.1 } }} transition={SPRING}>
                  <HabitGlyph icon={form.icon} className="size-7" strokeWidth={1.75} />
                </motion.span>
              </AnimatePresence>
            </span>
            <p className="mt-3 line-clamp-2 min-h-[1.25rem] text-sm font-semibold">{form.name.trim() || <span className="text-muted-foreground">Your habit</span>}</p>
            <p className="mt-0.5 line-clamp-2 min-h-4 text-[11px] text-muted-foreground">{form.description.trim()}</p>
          </div>

          {/* How it sits in the list: the row, its bar and its days. */}
          <div className="relative rounded-xl border border-border/60 bg-card/80 p-3 md:mt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg transition-[background-color,color] duration-300" style={{ background: tint(accent, 14), color: accent }}>
                <HabitGlyph icon={form.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{form.name.trim() || "Your habit"}</span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-secondary">
                  <motion.span className="block h-full w-full rounded-full" style={{ background: accent }} initial={{ transform: "translateX(-100%)" }} animate={{ transform: "translateX(-35%)" }} transition={{ duration: 0.8, ease: EASE_OUT }} />
                </span>
              </span>
            </div>
            <div className="mt-3 hidden justify-between md:flex">
              {WEEK.map((d, i) => {
                const on = frequencyApplies(form.frequency, (i + 1) % 7);
                return (
                  <span key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">{d}</span>
                    {/* A CSS transition, not Motion: it interpolates between the colour tokens itself, so a day never flashes empty mid-change. */}
                    <span className="size-2.5 rounded-full transition-[background-color,transform] duration-200" style={{ backgroundColor: on ? accent : "var(--secondary)", transform: on ? "scale(1)" : "scale(0.8)", transitionDelay: `${i * 20}ms` }} />
                  </span>
                );
              })}
            </div>
          </div>
          <p className="relative mt-3 hidden text-center text-[11px] text-muted-foreground md:block">
            <span style={{ color: accent }} className="font-semibold transition-colors duration-300">{category.label}</span> · {FREQUENCIES.find((f) => f.value === form.frequency)?.label}
          </p>

          <div className="relative mt-auto flex gap-2 pt-3 md:pt-6">
            <button type="button" onClick={onCancel} disabled={saving} className="press flex-1 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">Cancel</button>
            <button type="button" onClick={() => void save()} disabled={!ready || saving}
              className="press inline-flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-primary-foreground transition-[opacity,box-shadow] disabled:opacity-40"
              style={{ background: "var(--primary)", boxShadow: ready ? "0 8px 24px -10px color-mix(in oklch, var(--primary) 70%, transparent)" : undefined }}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" strokeWidth={3} />}
              {habit ? "Save" : "Create"}
            </button>
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}
