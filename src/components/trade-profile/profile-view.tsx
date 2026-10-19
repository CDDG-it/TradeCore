"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, HeartHandshake, Info } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { GrowBar } from "@/components/ui/grow-bar";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { thresholds } from "@/lib/trade-profile/config";
import { copy } from "@/lib/trade-profile/content/copy";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import { domains, facets, traitName } from "@/lib/trade-profile/content/traits";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { readTraderTypes, type TraderTypeReading, type TypeSignal } from "@/lib/trade-profile/trader-types";
import { DOMAINS, domainOf, type DomainCode, type FacetCode, type Profile, type TraitCode } from "@/lib/trade-profile/types";
import { InlinePill } from "@/components/trade-profile/motion-bits";
import { ScaleBar, Score, traitColor } from "@/components/trade-profile/primitives";
import { useDerived, useTradeProfile } from "@/components/trade-profile/store";
import { useProfileNav } from "@/components/trade-profile/nav";

export function SupportNote() {
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed text-foreground/85">
      <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <span className="font-semibold text-foreground">{copy.results.supportTitle}. </span>
        {copy.results.support}
      </p>
    </div>
  );
}

const tint = (color: string, pct: number) => `color-mix(in oklch, ${color} ${pct}%, transparent)`;
/** The trait names with soft hyphens at their syllables, so a narrow capsule column breaks them cleanly. */
const SHORT_NAME: Record<DomainCode, string> = {
  N: "Neuroti\u00ADcism", E: "Extra\u00ADversion", O: "Open\u00ADness", A: "Agree\u00ADable\u00ADness", C: "Conscien\u00ADtious\u00ADness",
};
const level = (s: Pick<TypeSignal, "op">) => (s.op === ">=" ? "High" : "Low");

/** A pattern in words: "High Anxiety, Anger or Vulnerability + Low Cautiousness". */
function patternText(reading: TraderTypeReading): string {
  if (!reading.groups.length) return copy.traderTypes.noPattern;
  return reading.groups
    .map((group) => {
      const uniform = group.every((s) => s.op === group[0].op);
      const names = group.map((s, i) => (uniform && i > 0 ? traitName(s.trait) : `${level(s)} ${traitName(s.trait)}`));
      return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
    })
    .join(" + ");
}

/** The domain a type is mostly about: where its strongest signal sits. */
function leadDomain(reading: TraderTypeReading | undefined): DomainCode | null {
  const signals = reading?.groups.flat() ?? [];
  if (!signals.length) return null;
  const best = [...signals].sort((a, b) => Number(b.met) - Number(a.met) || b.progress - a.progress)[0];
  return domainOf(best.trait);
}

/**
 * The profile on one screen, three columns that fill the frame (no scroll on
 * a laptop or larger): the trader type the profile matches and its pattern;
 * the five traits, with the facets of the one under the pointer; and every
 * trader type with how close the profile comes to it. Pointing at a type
 * previews it on the left and lights its traits in the middle, so it is plain
 * which personality signals make up which type.
 */
export function ProfileView() {
  const { profile, focus } = useDerived();
  const readings = useMemo(() => (profile ? readTraderTypes(profile) : []), [profile]);
  const [preview, setPreview] = useState<FocusAreaId | null>(null);
  const [picked, setPicked] = useState<DomainCode | null>(null);
  if (!profile || !focus || !readings.length) return null;

  const primary = readings[0];
  const shown = readings.find((r) => r.id === preview) ?? primary;
  const previewing = shown.id !== primary.id;
  // The traits the shown type is made of, lit in the personality column.
  const lit = new Set<TraitCode>(shown.groups.flat().map((s) => s.trait));
  const domain: DomainCode = previewing ? leadDomain(shown) ?? picked ?? "N" : picked ?? leadDomain(primary) ?? "N";

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <TypeCard reading={shown} previewing={previewing} secondary={readings[1]?.matched ? readings[1] : null} />
        <PersonalityPanel profile={profile} domain={domain} onDomain={setPicked} lit={lit} />
        <TypeList readings={readings} active={shown.id} onPreview={setPreview} />
      </div>
    </MotionConfig>
  );
}

/** Column one: the type, its pattern against this profile, and the next step. */
function TypeCard({ reading, previewing, secondary }: { reading: TraderTypeReading; previewing: boolean; secondary: TraderTypeReading | null }) {
  const { state, restartAssessment, demo } = useTradeProfile();
  const { supportNote } = useDerived();
  const nav = useProfileNav();
  const [note, setNote] = useState(false);
  const t = copy.traderTypes;
  const area = focusAreas[reading.id];
  const accent = reading.groups.length ? traitColor[domainOf(reading.groups[0][0].trait)] : "var(--primary)";
  const status = reading.rank === 0 ? t.strongest : reading.matched ? t.alsoShows : t.notShown(Math.round(reading.closeness * 100));

  return (
    <motion.section
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 xl:p-5"
      aria-label={previewing ? t.other : t.yours}
    >
      {/* The type's colour, washing in from the top left; it follows the preview. */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full opacity-25 blur-3xl transition-[background-color] duration-500" style={{ backgroundColor: accent }} />

      <div className="relative flex items-center justify-between gap-3">
        <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">{previewing ? t.other : t.yours}</p>
        <span className={cn("shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold", reading.matched ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground")}>{status}</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={reading.id} className="relative mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]"
          initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.22, ease: EASE_OUT }}>
          <h2 className="font-heading text-[clamp(1.45rem,2.1vw,1.9rem)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
            {area.traderType}
            {reading.groups.length > 0 && <InlinePill code={domainOf(reading.groups[0][0].trait)} value={Math.max(...reading.groups.flat().map((s) => s.score))} />}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{area.tradingProblem}</p>

          <p className="mt-4 text-[11px] font-semibold text-foreground/70">{t.pattern}</p>
          {reading.groups.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {reading.groups.map((group, gi) => (
                <div key={gi} className="contents">
                  {gi > 0 && <span className="px-0.5 text-xs font-bold text-muted-foreground">+</span>}
                  {group.map((s, si) => (
                    <div key={s.trait} className="contents">
                      {si > 0 && <span className="text-[10px] text-muted-foreground">or</span>}
                      <SignalChip signal={s} index={gi * 3 + si} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-foreground/80">{t.noPattern}</p>
          )}

          <p className="mt-4 text-[11px] font-semibold text-foreground/70">{t.train}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">{area.summary}</p>

          {!previewing && secondary && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t.also}: <span className="font-semibold text-foreground/85">{focusAreas[secondary.id].traderType}</span>
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative mt-3 space-y-2.5 border-t border-border/50 pt-3">
        <Button className="group w-full sm:w-auto" onClick={() => nav.goTab(state.goal ? "today" : "goal")}>
          {state.goal ? copy.focus.toToday : copy.focus.cta} <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-muted-foreground">
          {supportNote && (
            <button type="button" onClick={() => setNote(!note)} aria-expanded={note} className="inline-flex items-center gap-1 text-primary hover:text-primary/80">
              <HeartHandshake className="size-3.5" /> {t.wellbeing}
            </button>
          )}
          <button type="button" onClick={() => nav.goTab("library")} className="underline-offset-4 hover:text-foreground hover:underline">{copy.results.evidenceLink}</button>
          {!demo && <button type="button" onClick={() => confirm(copy.results.retakeConfirm) && restartAssessment()} className="underline-offset-4 hover:text-foreground hover:underline">{copy.results.retake}</button>}
          <span className="inline-flex items-center gap-1" title={t.hypothesis}><Info className="size-3" /> Hypothesis</span>
        </div>
      </div>

      {/* The wellbeing note opens over the card rather than pushing the screen taller. */}
      <AnimatePresence>
        {note && (
          <motion.div key="note" className="absolute inset-x-3 bottom-3 z-10" initial={{ opacity: 0, transform: "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0, transform: "translateY(8px)" }} transition={{ duration: 0.2, ease: EASE_OUT }}>
            <button type="button" onClick={() => setNote(false)} className="block w-full text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)]">
              <SupportNote />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/** One signal of a pattern: the trait, its level, this trader's score, and how far toward the line it has come. */
function SignalChip({ signal, index }: { signal: TypeSignal; index: number }) {
  const color = traitColor[domainOf(signal.trait)];
  return (
    <motion.span
      initial={{ opacity: 0, transform: "scale(0.94)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      transition={{ duration: 0.22, delay: 0.08 + index * 0.05, ease: EASE_OUT }}
      className={cn("relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1 text-[11px] font-medium", signal.met ? "text-foreground" : "border-dashed text-muted-foreground")}
      style={signal.met ? { background: tint(color, 12), borderColor: tint(color, 40) } : undefined}
      title={`${traitName(signal.trait)} ${Math.round(signal.score)} (${signal.op === ">=" ? "at or above" : "at or below"} ${signal.threshold})`}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {level(signal)} {traitName(signal.trait)}
      <span className="font-bold tabular-nums">{Math.round(signal.score)}</span>
      <motion.span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left" style={{ background: color }}
        initial={{ transform: "scaleX(0)" }} animate={{ transform: `scaleX(${signal.progress})` }} transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: EASE_OUT }} />
    </motion.span>
  );
}

/**
 * Column two: the five traits as capsules filled to their score, with the
 * low and high lines across them, and the six facets of the trait in focus.
 * Traits and facets that make up the type on the left are lit.
 */
function PersonalityPanel({ profile, domain, onDomain, lit }: { profile: Profile; domain: DomainCode; onDomain: (d: DomainCode) => void; lit: Set<TraitCode> }) {
  const nav = useProfileNav();
  const t = copy.traderTypes;
  const litDomain = (d: DomainCode) => [...lit].some((trait) => domainOf(trait) === d);

  return (
    <motion.section
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.35, delay: 0.07, ease: EASE_OUT }}
      className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4 xl:p-5"
      aria-label={t.personality}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.personality}</h3>
        <span className="text-[11px] text-muted-foreground">{t.personalityHint}</span>
      </div>

      {/* Five capsules, filled from the bottom; the dashed lines are the low and high marks. */}
      <div className="relative mt-3 flex min-h-[6.5rem] flex-1 items-stretch gap-3">
        {DOMAINS.map((d, i) => {
          const on = d === domain;
          const score = profile.domains[d]!;
          return (
            <button key={d} type="button" onMouseEnter={() => onDomain(d)} onFocus={() => onDomain(d)} onClick={() => onDomain(d)} aria-pressed={on}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 outline-none">
              <span className={cn("text-sm font-bold tabular-nums transition-colors", on ? "text-foreground" : "text-muted-foreground")}><Score value={score} /></span>
              <span className={cn("relative w-full max-w-12 flex-1 overflow-hidden rounded-full bg-muted/50 transition-[box-shadow] duration-300", on && "ring-1 ring-foreground/25")}
                style={litDomain(d) ? { boxShadow: `0 0 26px -6px ${traitColor[d]}` } : undefined}>
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full"
                  style={{ background: `linear-gradient(180deg, ${traitColor[d]}, ${tint(traitColor[d], 35)})` }}
                  initial={{ transform: "scaleY(0)" }}
                  animate={{ transform: `scaleY(${score / 100})` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 + i * 0.07 }}
                />
                {[thresholds.low, thresholds.high].map((mark) => (
                  <span key={mark} aria-hidden className="absolute inset-x-0 border-t border-dashed border-white/25" style={{ bottom: `${mark}%` }} />
                ))}
              </span>
              <span className={cn("max-w-full text-center text-[11px] font-semibold leading-tight [hyphens:manual] transition-colors", on ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                {SHORT_NAME[d]}
              </span>
              {on && <motion.span layoutId="profile-domain-mark" className="h-0.5 w-6 rounded-full" style={{ background: traitColor[d] }} transition={SPRING} />}
              {!on && <span className="h-0.5 w-6" />}
            </button>
          );
        })}
      </div>

      {/* The facets of the trait in focus. */}
      <div className="mt-3 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold">{t.facetsOf(domains[domain].name)}</p>
          <button type="button" onClick={() => nav.openDomain(domain)} className="group inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            {t.open} <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={domain} className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.16 }}>
            {([1, 2, 3, 4, 5, 6] as const).map((n, i) => {
              const f = `${domain}${n}` as FacetCode;
              const on = lit.has(f) || lit.has(domain);
              return (
                <li key={f} className="min-w-0">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                    <span className={cn("truncate", on ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {on && <span className="mr-1 inline-block size-1.5 rounded-full align-middle" style={{ background: traitColor[domain] }} />}
                      {facets[f].name}
                    </span>
                    <Score value={profile.facets[f]!} className="text-xs" />
                  </div>
                  <ScaleBar value={profile.facets[f]!} color={traitColor[domain]} size="sm" delay={0.05 + i * 0.04} />
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/** Column three: every trader type, matched ones first, with how close the profile comes to each. */
function TypeList({ readings, active, onPreview }: { readings: TraderTypeReading[]; active: FocusAreaId; onPreview: (id: FocusAreaId | null) => void }) {
  const t = copy.traderTypes;
  return (
    <motion.section
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.35, delay: 0.14, ease: EASE_OUT }}
      className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4 xl:p-5"
      aria-label={t.listTitle}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.listTitle}</h3>
        <span className="text-[11px] text-muted-foreground">{t.listHint}</span>
      </div>
      <ul className="-mx-2 mt-2 min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" onMouseLeave={() => onPreview(null)}>
        {readings.map((r, i) => {
          const on = r.id === active;
          return (
            <motion.li key={r.id} initial={{ opacity: 0, transform: "translateX(8px)" }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: EASE_OUT }}>
              <button type="button" onMouseEnter={() => onPreview(r.id)} onFocus={() => onPreview(r.id)} onClick={() => onPreview(r.id)}
                className={cn("relative isolate block w-full rounded-xl px-2.5 py-1 text-left transition-opacity duration-200", !r.matched && !on && "opacity-70 hover:opacity-100")}>
                {on && <motion.span layoutId="profile-type-active" className="absolute inset-0 -z-10 rounded-xl border border-white/[0.08] bg-muted/40" transition={SPRING} />}
                <span className="flex items-center gap-2">
                  {r.rank === 0 ? <Badge tone="primary">{t.you}</Badge> : r.matched ? <Badge tone="ice">{t.alsoBadge}</Badge> : null}
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">{focusAreas[r.id].traderType}</span>
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground"><CountUp value={Math.round(r.closeness * 100)} format={(n) => `${Math.round(n)}%`} /></span>
                </span>
                <span className="block truncate text-[11px] leading-snug text-muted-foreground">{patternText(r)}</span>
                <GrowBar className="mt-1 h-[3px] bg-muted/50" fillClassName={r.matched ? "bg-primary" : "bg-muted-foreground/45"} value={r.closeness} delay={0.3 + i * 0.05} />
              </button>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{t.hypothesis}</p>
    </motion.section>
  );
}

function Badge({ tone, children }: { tone: "primary" | "ice"; children: React.ReactNode }) {
  return <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider", tone === "primary" ? "bg-primary text-primary-foreground" : "bg-ice/15 text-ice")}>{children}</span>;
}

/** One domain: its score and range on top, then its six facets as a two-column reading list. */
export function DomainDetail({ code }: { code: DomainCode }) {
  const { profile } = useDerived();
  const nav = useProfileNav();
  if (!profile) return null;
  const text = domains[code];
  const color = traitColor[code];
  const t = copy.results;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.back({ kind: "tab", tab: "profile" })} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> {t.title}
      </button>

      <section className="grid gap-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{text.name}<InlinePill code={code} value={profile.domains[code]!} /></h2>
            <Score value={profile.domains[code]!} className="font-heading text-4xl tracking-tight" />
          </div>
          <div className="mt-3">
            <ScaleBar value={profile.domains[code]!} color={color} />
          </div>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{text.about}</p>
        </div>
        <dl className="grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-foreground/70">{t.lowEnd}</dt>
            <dd className="mt-0.5 text-foreground/85">{text.low}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-foreground/70">{t.highEnd}</dt>
            <dd className="mt-0.5 text-foreground/85">{text.high}</dd>
          </div>
          <div className="rounded-xl border border-ice/15 bg-ice/[0.05] p-3.5 sm:col-span-2">
            <dt className="text-xs font-semibold text-ice">{t.trading}</dt>
            <dd className="mt-0.5 text-foreground/90">{text.trading}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        <h3 className="font-heading text-sm font-bold tracking-tight">{t.facets}</h3>
        <div className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {([1, 2, 3, 4, 5, 6] as const).map((n, i) => {
            const f = `${code}${n}` as FacetCode;
            const ft = facets[f];
            return (
              <article key={f} className="rise-in" style={{ ["--i" as string]: i }}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h4 className="text-[15px] font-semibold tracking-tight">{ft.name}</h4>
                  <Score value={profile.facets[f]!} className="text-lg" />
                </div>
                <ScaleBar value={profile.facets[f]!} color={color} size="sm" delay={0.15 + i * 0.06} />
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{ft.about}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
                  <span className="font-semibold text-ice">{t.trading}. </span>
                  {ft.trading}
                </p>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          {t.tradingNote} {t.measurement[1]}
        </p>
      </section>
    </div>
  );
}
