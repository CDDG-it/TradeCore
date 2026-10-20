"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Clock, Play, Square, Wind, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EASE_OUT, rise } from "@/lib/motion";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { insights, type Drill, type Read } from "@/lib/trade-profile/content/insights";
import { referenceById, shortCite } from "@/lib/trade-profile/content/references";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { Eyebrow, Pill, SourceLink, SourceList, StatusPill } from "@/components/trade-profile/primitives";

interface NewsItem { title: string; url: string; source: string; publishedAt: string }

/**
 * The part of Today that is about the trader's type rather than the program:
 * three drills for the moment itself, two short reads, what the research says
 * and recent articles on the theme. Everything links to its sources.
 */
export function ForYourType({ type }: { type: FocusAreaId }) {
  const t = copy.forType;
  const content = insights[type];
  const [drill, setDrill] = useState<Drill | null>(null);
  const [read, setRead] = useState<Read | null>(null);

  return (
    <section aria-label={t.title(focusAreas[type].traderType)} className="space-y-4 pt-2">
      <motion.div {...rise(0)} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight">{t.title(focusAreas[type].traderType)}</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{t.lead}</p>
        </div>
      </motion.div>

      {/* Drills: three cards, the breathing ones with a live preview of their rhythm. */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-sm font-bold tracking-tight">{t.drills}</h3>
          <span className="text-[11px] text-muted-foreground">{t.drillsHint}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {content.drills.map((d, i) => (
            <motion.button
              key={d.id}
              type="button"
              onClick={() => setDrill(d)}
              {...rise(i + 1, 0.06)}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-left transition-[border-color,box-shadow] duration-300 hover:border-primary/35 hover:shadow-[0_18px_40px_-28px_rgba(20,184,166,.5)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  {d.breath ? <Wind className="size-4" /> : <Zap className="size-4" />}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="size-3" />{d.duration}</span>
              </div>
              <p className="mt-3 font-heading text-[15px] font-bold tracking-tight">{d.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.when}</p>
              {d.breath && <BreathPreview drill={d} />}
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                {t.open} <ArrowUpRight className="size-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Reads beside the facts, then the news across the width. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <h3 className="mb-2.5 font-heading text-sm font-bold tracking-tight">{t.reads}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.reads.map((r, i) => (
              <motion.button key={r.id} type="button" onClick={() => setRead(r)} {...rise(i + 4, 0.06)}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/35">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><BookOpen className="size-3.5 text-ice" />{t.minutes(r.minutes)}</span>
                <p className="mt-2 font-heading text-[15px] font-bold leading-snug tracking-tight">{r.title}</p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{r.paragraphs[0]}</p>
                <span className="mt-auto pt-3 text-[11px] font-semibold text-primary">{t.open}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <FactCarousel type={type} />
      </div>

      <NewsList type={type} />

      <DrillSheet drill={drill} onClose={() => setDrill(null)} />
      <ReadSheet read={read} onClose={() => setRead(null)} />
    </section>
  );
}

/** A small dot breathing in the drill's rhythm, so the card shows what it asks for. */
function BreathPreview({ drill }: { drill: Drill }) {
  const reduce = useReducedMotion();
  if (!drill.breath || reduce) return null;
  const phases = drill.breath.phases;
  const total = phases.reduce((s, p) => s + p.seconds, 0);
  // Where each phase ends, as a share of the whole cycle.
  const times = [0, ...phases.map((_, i) => phases.slice(0, i + 1).reduce((sum, p) => sum + p.seconds, 0) / total)];
  const sizes = [phases[phases.length - 1].size, ...phases.map((p) => p.size)];
  return (
    <span aria-hidden className="absolute right-4 top-14 grid size-10 place-items-center">
      <motion.span className="size-10 rounded-full bg-primary/25" animate={{ transform: sizes.map((s) => `scale(${0.35 + s * 0.65})`) }}
        transition={{ duration: total, times, ease: "easeInOut", repeat: Infinity }} />
    </span>
  );
}

/** What the research says: one fact at a time, with its source's status. */
function FactCarousel({ type }: { type: FocusAreaId }) {
  const facts = insights[type].facts;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const fact = facts[i % facts.length];
  const ref = referenceById[fact.ref];
  const step = (by: number) => { setDir(by); setI((x) => (x + by + facts.length) % facts.length); };
  return (
    <motion.section {...rise(6, 0.06)} className="flex flex-col rounded-2xl border border-border/60 bg-card p-4" aria-roledescription="carousel" aria-label={copy.forType.facts}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{copy.forType.facts}</h3>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous fact" onClick={() => step(-1)} className="press grid size-7 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
          <span className="w-8 text-center text-[11px] tabular-nums text-muted-foreground">{(i % facts.length) + 1}/{facts.length}</span>
          <button type="button" aria-label="Next fact" onClick={() => step(1)} className="press grid size-7 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
      <div className="relative mt-3 min-h-[7.5rem] flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={fact.text} initial={{ opacity: 0, transform: `translateX(${dir * 24}px)` }} animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: `translateX(${dir * -24}px)`, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: EASE_OUT }}>
            <p className="font-heading text-[17px] font-semibold leading-snug tracking-tight [text-wrap:pretty]">{fact.text}</p>
            {ref && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <StatusPill status={ref.status} />
                <SourceLink reference={ref} className="text-muted-foreground hover:text-foreground"><span className="truncate">{shortCite(ref.citation)}</span></SourceLink>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/** Recent articles on the type's theme, fetched live; quiet when there are none. */
function NewsList({ type }: { type: FocusAreaId }) {
  const t = copy.forType;
  const [state, setState] = useState<{ status: "loading" | "ok" | "unavailable"; items: NewsItem[] }>({ status: "loading", items: [] });
  useEffect(() => {
    let active = true;
    fetch(`/api/trade-profile/news?type=${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { status: "ok" | "unavailable"; items: NewsItem[] }) => { if (active) setState({ status: body.status, items: body.items ?? [] }); })
      .catch(() => { if (active) setState({ status: "unavailable", items: [] }); });
    return () => { active = false; };
  }, [type]);

  return (
    <motion.section {...rise(7, 0.06)} className="rounded-2xl border border-border/60 bg-card p-4" aria-label={t.news}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.news}</h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:hidden" /><span className="relative size-1.5 rounded-full bg-primary" /></span>
          {t.live}
        </span>
      </div>
      {state.status === "loading" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className="h-20 animate-pulse rounded-xl bg-muted/30" />)}</div>
      ) : state.items.length ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {state.items.map((n, k) => (
            <motion.li key={n.url} initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.28, delay: k * 0.06, ease: EASE_OUT }}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-xl border border-border/50 bg-background/30 p-3 transition-colors hover:border-primary/35">
                <span className="line-clamp-3 text-[13px] font-semibold leading-snug group-hover:text-primary">{n.title}</span>
                <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{n.source}</span>
                  <span className="inline-flex shrink-0 items-center gap-1">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}<ArrowUpRight className="size-3" /></span>
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{state.status === "ok" ? t.newsEmpty : t.newsUnavailable}</p>
      )}
    </motion.section>
  );
}

/** A drill in full: when, how, why, the sources, and for breathing drills a guide to follow. */
export function DrillSheet({ drill, onClose }: { drill: Drill | null; onClose: () => void }) {
  const t = copy.forType;
  return (
    <Sheet open={!!drill} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {drill && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap gap-1.5"><Pill tone="primary">{drill.duration}</Pill></div>
              <SheetTitle className="mt-2 font-heading text-xl font-bold tracking-tight">{drill.title}</SheetTitle>
              <SheetDescription>{t.when}: {drill.when}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              {drill.breath && <BreathGuide key={drill.id} drill={drill} />}
              <section>
                <Eyebrow>{t.steps}</Eyebrow>
                <ol className="mt-2 space-y-2">
                  {drill.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">{i + 1}</span>{s}
                    </li>
                  ))}
                </ol>
              </section>
              <section className="rounded-xl border border-ice/15 bg-ice/[0.06] p-3.5">
                <Eyebrow tone="ice">{t.why}</Eyebrow>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{drill.why}</p>
              </section>
              <SourceList ids={drill.refs} title={t.sources} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReadSheet({ read, onClose }: { read: Read | null; onClose: () => void }) {
  const t = copy.forType;
  return (
    <Sheet open={!!read} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {read && (
          <>
            <SheetHeader>
              <p className="text-[11px] text-muted-foreground">{t.minutes(read.minutes)}</p>
              <SheetTitle className="mt-1 font-heading text-2xl font-bold leading-tight tracking-tight">{read.title}</SheetTitle>
              <SheetDescription className="sr-only">{read.paragraphs[0]}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              {read.paragraphs.map((p, i) => (
                <motion.p key={p} className="text-[15px] leading-relaxed text-foreground/90" initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, delay: 0.05 + i * 0.07, ease: EASE_OUT }}>{p}</motion.p>
              ))}
              <SourceList ids={read.refs} title={t.sources} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * A guide to breathe along with: a circle that grows and shrinks with each
 * phase, the phase's name and the round. Under reduced motion the circle stays
 * still and only the words change.
 */
function BreathGuide({ drill }: { drill: Drill }) {
  const t = copy.forType;
  const reduce = useReducedMotion();
  const breath = drill.breath!;
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(() => {
      const nextPhase = (phase + 1) % breath.phases.length;
      if (nextPhase === 0) {
        if (round + 1 >= breath.rounds) { setRunning(false); setDone(true); setPhase(0); setRound(0); return; }
        setRound(round + 1);
      }
      setPhase(nextPhase);
    }, breath.phases[phase].seconds * 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, phase, round, breath]);

  const current = breath.phases[phase];
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow tone="primary">{t.guide}</Eyebrow>
        <button type="button" onClick={() => { setDone(false); setRunning((r) => !r); setPhase(0); setRound(0); }}
          className="press inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          {running ? <><Square className="size-3" /> {t.stop}</> : <><Play className="size-3" /> {t.start}</>}
        </button>
      </div>
      <div className="relative mx-auto mt-4 grid size-40 place-items-center">
        <span className="absolute inset-0 rounded-full border border-primary/20" />
        <motion.span
          className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,.55),rgba(20,184,166,.12))] shadow-[0_0_40px_-6px_rgba(20,184,166,.6)]"
          animate={{ transform: `scale(${running && !reduce ? current.size : 0.55})` }}
          transition={{ duration: running ? current.seconds : 0.4, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.span key={done ? "done" : running ? `${round}-${phase}` : "idle"} className={cn("relative px-4 text-center text-sm font-semibold", done && "text-primary")}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {done ? t.done : running ? current.label : drill.duration}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-[11px] tabular-nums text-muted-foreground">{running ? t.round(round + 1, breath.rounds) : " "}</p>
    </section>
  );
}
