"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Clock, Play, Square, Wind, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
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
  const [panel, setPanel] = useState<"drills" | "reads" | "research" | "news">("drills");
  const panels = [
    { key: "drills", label: t.drills },
    { key: "reads", label: t.reads },
    { key: "research", label: copy.forType.facts },
    { key: "news", label: t.news },
  ] as const;

  return (
    <section aria-label={t.title(focusAreas[type].traderType)} className="flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-border/60 bg-card/45 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-base font-bold tracking-tight">{t.title(focusAreas[type].traderType)}</h2>
          <p className="text-xs text-muted-foreground">{t.lead}</p>
        </div>
        <div role="group" aria-label={t.title(focusAreas[type].traderType)} className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border/60 bg-background/40 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {panels.map(({ key, label }) => (
            <button key={key} type="button" aria-pressed={panel === key} onClick={() => setPanel(key)}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors", panel === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {panel === "drills" && (
          <div className="flex h-full flex-col gap-1">
            <p className="text-[11px] text-muted-foreground">{t.drillsHint}</p>
            <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-3">
            {content.drills.map((d) => (
              <button key={d.id} type="button" onClick={() => setDrill(d)}
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:border-primary/35">
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">{d.breath ? <Wind className="size-4" /> : <Zap className="size-4" />}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="size-3" />{d.duration}</span>
                </span>
                <span className="mt-2 font-heading text-sm font-bold tracking-tight">{d.title}</span>
                <span className="mt-0.5 text-xs leading-snug text-muted-foreground">{d.when}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[11px] font-semibold text-primary">{t.open} <ArrowUpRight className="size-3" /></span>
              </button>
            ))}
            </div>
          </div>
        )}
        {panel === "reads" && (
          <div className="grid h-full gap-2 sm:grid-cols-2">
            {content.reads.map((r) => (
              <button key={r.id} type="button" onClick={() => setRead(r)}
                className="group flex min-w-0 flex-col rounded-xl border border-border/60 bg-background/40 p-3 text-left transition-colors hover:border-primary/35">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><BookOpen className="size-3.5 text-ice" />{t.minutes(r.minutes)}</span>
                <span className="mt-1.5 font-heading text-sm font-bold leading-snug tracking-tight">{r.title}</span>
                <span className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{r.paragraphs[0]}</span>
                <span className="mt-auto pt-2 text-[11px] font-semibold text-primary">{t.open}</span>
              </button>
            ))}
          </div>
        )}
        {panel === "research" && <FactCarousel type={type} />}
        {panel === "news" && <NewsList type={type} />}
      </div>

      <DrillSheet drill={drill} onClose={() => setDrill(null)} />
      <ReadSheet read={read} onClose={() => setRead(null)} />
    </section>
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
    <section className="flex h-full flex-col rounded-xl border border-border/60 bg-background/40 p-3" aria-roledescription="carousel" aria-label={copy.forType.facts}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{copy.forType.facts}</h3>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous fact" onClick={() => step(-1)} className="press grid size-7 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
          <span className="w-8 text-center text-[11px] tabular-nums text-muted-foreground">{(i % facts.length) + 1}/{facts.length}</span>
          <button type="button" aria-label="Next fact" onClick={() => step(1)} className="press grid size-7 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
      <div className="relative mt-2 min-h-16 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={fact.text} initial={{ opacity: 0, transform: `translateX(${dir * 24}px)` }} animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: `translateX(${dir * -24}px)`, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: EASE_OUT }}>
            <p className="font-heading text-[15px] font-semibold leading-snug tracking-tight [text-wrap:pretty]">{fact.text}</p>
            {ref && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <StatusPill status={ref.status} />
                <SourceLink reference={ref} className="text-muted-foreground hover:text-foreground"><span className="truncate">{shortCite(ref.citation)}</span></SourceLink>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
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
    <section className="h-full rounded-xl border border-border/60 bg-background/40 p-3" aria-label={t.news}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.news}</h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:hidden" /><span className="relative size-1.5 rounded-full bg-primary" /></span>
          {t.live}
        </span>
      </div>
      {state.status === "loading" ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className="h-16 animate-pulse rounded-xl bg-muted/30" />)}</div>
      ) : state.items.length ? (
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {state.items.map((n) => (
            <li key={n.url}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-xl border border-border/50 bg-background/30 p-2.5 transition-colors hover:border-primary/35">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug group-hover:text-primary">{n.title}</span>
                <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{n.source}</span>
                  <span className="inline-flex shrink-0 items-center gap-1">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}<ArrowUpRight className="size-3" /></span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{state.status === "ok" ? t.newsEmpty : t.newsUnavailable}</p>
      )}
    </section>
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
