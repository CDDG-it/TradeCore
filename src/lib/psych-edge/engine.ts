/**
 * Psychological Edge — a rule-based coaching engine.
 *
 * The journal already records what happened on every trade: result, execution
 * quality, the trader's own discipline checklist, confluences, linked
 * pre-market analysis, and free-text notes. This engine never asks the trader
 * to repeat any of that. It reads it, looks for contradictions and recurring
 * behavior across the trade history, and produces one measurable objective
 * for the next session.
 *
 * Internally this follows a Report → Respond → Relate → Reason → Reconstruct
 * shape (report what the data shows, surface the tension, connect it to
 * history, ask why, propose a concrete change) — but that structure is never
 * exposed as section titles. It reads as a short, direct coaching note.
 *
 * IMPORTANT — data reality check: TradeJournalEntry has a legacy set of fixed
 * discipline booleans (followed_plan, respected_stop_loss, ...) and a
 * market_context object that the current journal form never sets — they are
 * always false/undefined for every real trade. This engine deliberately does
 * NOT use them. It only reasons over fields the journal form actually writes:
 * result, execution_quality, discipline.custom_checks (+score), confluences,
 * linked_analysis_id (cross-referenced against the linked analysis's bias),
 * and the free-text fields.
 */
import { format } from "date-fns";
import { tradeR, instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession } from "@/lib/types";

// ── Small helpers ─────────────────────────────────────────────────────
const fmtR = (v: number): string => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const sum = (xs: number[]): number => xs.reduce((s, x) => s + x, 0);
const mean = (xs: number[]): number | null => (xs.length ? sum(xs) / xs.length : null);
const slug = (s: string): string =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
const fmtDate = (d: string): string => format(new Date(d + "T12:00:00"), "MMM d");

// ── Per-trade signal — the facts this engine is allowed to reason over ──
interface Tag {
  norm: string;
  original: string;
}

interface Signal {
  trade: TradeJournalEntry;
  netR: number;
  ruleCount: number;
  brokenRules: string[];
  allRulesPassed: boolean;
  blankMistakes: boolean;
  biasMismatch: boolean;
  linkedBias: "bullish" | "bearish" | null;
  tags: Tag[];
}

function buildSignal(trade: TradeJournalEntry, analysisById: Map<string, PreTradeAnalysis>): Signal {
  const custom = trade.discipline?.custom_checks ?? [];
  const brokenRules = custom.filter((c) => !c.passed).map((c) => c.label);
  const ruleCount = custom.length;
  const allRulesPassed = ruleCount > 0 && brokenRules.length === 0;
  const blankMistakes = !trade.mistakes || trade.mistakes.trim() === "";

  let biasMismatch = false;
  let linkedBias: "bullish" | "bearish" | null = null;
  if (trade.linked_analysis_id) {
    const a = analysisById.get(trade.linked_analysis_id);
    if (a && (a.bias === "bullish" || a.bias === "bearish")) {
      linkedBias = a.bias;
      const expectedDirection = a.bias === "bullish" ? "long" : "short";
      biasMismatch = trade.direction !== expectedDirection;
    }
  }

  const tags: Tag[] = (trade.confluences ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .map((original) => ({ original, norm: original.toLowerCase() }));

  return { trade, netR: tradeR(trade), ruleCount, brokenRules, allRulesPassed, blankMistakes, biasMismatch, linkedBias, tags };
}

// ── Findings ──────────────────────────────────────────────────────────
type FindingKind = "commitment" | "contradiction" | "pattern" | "strength";

interface Finding {
  priority: number;
  kind: FindingKind;
  /** e.g. "recurring_rule:respected-stop-loss" — family is the part before ':' */
  patternKey: string | null;
  recurringLabel: string | null;
  text: string;
}

function outcomeContradiction(latest: Signal): Finding | null {
  if (latest.trade.execution_quality !== "good" || latest.netR >= 0) return null;
  const rule = latest.brokenRules[0];
  const ruleClause = rule ? ` You also marked "${rule}" as not followed.` : "";
  return {
    priority: 95,
    kind: "contradiction",
    patternKey: "outcome-vs-process",
    recurringLabel: null,
    text: `You rated your execution on this ${instrumentName(latest.trade.instrument)} trade as good, yet it closed at ${fmtR(latest.netR)}.${ruleClause} Are you judging execution by outcome, or by process?`,
  };
}

function selfContradiction(latest: Signal): Finding | null {
  if (latest.trade.execution_quality !== "good" || latest.brokenRules.length === 0 || latest.netR < 0) return null;
  const rule = latest.brokenRules[0];
  return {
    priority: 90,
    kind: "contradiction",
    patternKey: `self-contradiction:${slug(rule)}`,
    recurringLabel: rule,
    text: `You called this execution good, but you also marked "${rule}" as not followed. Which one is true?`,
  };
}

function biasMismatchFinding(latest: Signal): Finding | null {
  if (!latest.biasMismatch || !latest.linkedBias) return null;
  return {
    priority: 92,
    kind: "contradiction",
    patternKey: "bias-mismatch",
    recurringLabel: null,
    text: `Your pre-market analysis called ${latest.linkedBias}, but you took this ${instrumentName(latest.trade.instrument)} trade ${latest.trade.direction}. What changed between the analysis and the entry?`,
  };
}

function perfectProcessFinding(latest: Signal): Finding | null {
  if (!(latest.ruleCount >= 3 && latest.allRulesPassed && latest.netR < 0)) return null;
  return {
    priority: 88,
    kind: "contradiction",
    patternKey: "process-vs-outcome-perfect",
    recurringLabel: null,
    text: `You followed every rule on your own checklist on this trade and still lost. That's not a discipline problem — is it possible the setup itself needs another look, or are you already sure the process was right and just accepting the variance?`,
  };
}

function blankMistakeFinding(latest: Signal): Finding | null {
  const badOutcome = latest.trade.result === "loss" || latest.trade.execution_quality === "bad";
  if (!badOutcome || !latest.blankMistakes) return null;
  return {
    priority: 80,
    kind: "contradiction",
    patternKey: "blank-mistakes",
    recurringLabel: null,
    text: `You didn't log a mistake for this trade. Does that mean there wasn't one, or did you stop analyzing once it was over?`,
  };
}

function recurringRuleFinding(signals: Signal[]): Finding | null {
  const latest = signals[signals.length - 1];
  if (latest.brokenRules.length === 0) return null;

  // Consecutive streak ending at the latest trade.
  for (const rule of latest.brokenRules) {
    let streak = 0;
    for (let i = signals.length - 1; i >= 0; i--) {
      if (signals[i].brokenRules.includes(rule)) streak++;
      else break;
    }
    if (streak >= 3) {
      return {
        priority: 85,
        kind: "pattern",
        patternKey: `recurring-rule:${slug(rule)}`,
        recurringLabel: rule,
        text: `This is the ${ordinal(streak)} trade in a row where you didn't follow "${rule}". At what point does this stop being a slip and start being how you actually trade?`,
      };
    }
  }

  // Frequency across a trailing window, even if not strictly consecutive.
  const window = signals.slice(-10);
  const counts = new Map<string, number>();
  for (const s of window) for (const r of s.brokenRules) counts.set(r, (counts.get(r) ?? 0) + 1);
  const threshold = Math.max(3, Math.ceil(window.length * 0.5));
  for (const [rule, count] of counts) {
    if (count >= threshold && latest.brokenRules.includes(rule)) {
      return {
        priority: 82,
        kind: "pattern",
        patternKey: `recurring-rule:${slug(rule)}`,
        recurringLabel: rule,
        text: `You've broken "${rule}" on ${count} of your last ${window.length} trades. What's making this rule harder to hold than the others?`,
      };
    }
  }
  return null;
}

function setupPatternFinding(signals: Signal[]): Finding | null {
  const latest = signals[signals.length - 1];
  if (latest.tags.length === 0) return null;
  const monthKey = latest.trade.date_time.slice(0, 7);
  const monthSignals = signals.filter((s) => s.trade.date_time.slice(0, 7) === monthKey);

  for (const tag of latest.tags) {
    const withTag = monthSignals.filter((s) => s.tags.some((t) => t.norm === tag.norm));
    if (withTag.length < 3) continue;
    const losses = withTag.filter((s) => s.trade.result === "loss").length;
    const wins = withTag.filter((s) => s.trade.result === "win").length;
    if (losses >= 2 && losses >= wins) {
      return {
        priority: 75,
        kind: "pattern",
        patternKey: `setup-pattern:${tag.norm}`,
        recurringLabel: tag.original,
        text: `This is the ${ordinal(withTag.length)} "${tag.original}" setup this month, and it's ${wins}W-${losses}L. Is the setup failing, or is your execution changing after entry?`,
      };
    }
  }
  return null;
}

function scoreDivergenceFinding(signals: Signal[]): Finding | null {
  const window = signals.slice(-10).filter((s) => s.ruleCount > 0);
  if (window.length < 4) return null;
  const avgScore = mean(window.map((s) => s.trade.discipline?.score ?? 0));
  const netR = sum(window.map((s) => s.netR));
  if (avgScore === null) return null;

  if (avgScore >= 85 && netR <= -2) {
    return {
      priority: 70,
      kind: "pattern",
      patternKey: "score-divergence:high-score-losing",
      recurringLabel: null,
      text: `Your discipline score has averaged ${Math.round(avgScore)}% over your last ${window.length} rule-tracked trades, but you're net ${fmtR(netR)} across them. If you're following your rules and still losing, are they actually the right rules — or is the market telling you something your checklist doesn't measure?`,
    };
  }
  if (avgScore <= 50 && netR >= 3) {
    return {
      priority: 65,
      kind: "pattern",
      patternKey: "score-divergence:low-score-winning",
      recurringLabel: null,
      text: `You're net ${fmtR(netR)} over your last ${window.length} rule-tracked trades despite a discipline score averaging only ${Math.round(avgScore)}%. That's the account rewarding a streak, not your process. What happens the day variance turns and the discipline still isn't there?`,
    };
  }
  return null;
}

function steadyStateFinding(signals: Signal[]): Finding | null {
  const window = signals.slice(-10);
  if (window.length < 3) return null;
  const netR = sum(window.map((s) => s.netR));
  const ruleWindow = window.filter((s) => s.ruleCount > 0);
  const avgScore = ruleWindow.length ? mean(ruleWindow.map((s) => s.trade.discipline?.score ?? 0)) : null;
  return {
    priority: 10,
    kind: "strength",
    patternKey: "steady-state",
    recurringLabel: null,
    text:
      avgScore !== null
        ? `Your last ${window.length} trades average ${Math.round(avgScore)}% on your own checklist and you're net ${fmtR(netR)} over that stretch. Nothing here contradicts itself — the only question is whether you can hold this when a setup looks great but breaks a rule.`
        : `Your last ${window.length} trades are net ${fmtR(netR)} with no contradictions between what you rated and what you logged. Keep building the sample — the patterns worth coaching usually show up over 15-20 trades, not 5.`,
  };
}

/** How many of the most recent sessions in a row (starting from the newest)
 *  share the same pattern_key. `priorSessions` must be sorted newest-first. */
function patternStreak(priorSessions: PsychEdgeSession[], patternKey: string): number {
  let n = 0;
  for (const s of priorSessions) {
    if (s.pattern_key === patternKey) n++;
    else break;
  }
  return n;
}

function commitmentFinding(signals: Signal[], priorSessions: PsychEdgeSession[]): Finding | null {
  if (priorSessions.length === 0) return null;
  const prior = priorSessions[0];
  if (!prior.pattern_key) return null;

  const since = signals.filter((s) => s.trade.date_time.slice(0, 10) > prior.date);
  if (since.length === 0) return null; // nothing new to check yet

  const [family, arg] = prior.pattern_key.split(":");
  const label = prior.recurring_pattern_label ?? arg ?? "";
  let stillPresent = false;

  if (family === "recurring-rule" || family === "self-contradiction") {
    stillPresent = since.some((s) => s.brokenRules.some((r) => slug(r) === arg));
  } else if (family === "bias-mismatch") {
    stillPresent = since.some((s) => s.biasMismatch);
  } else if (family === "setup-pattern") {
    stillPresent = since.some((s) => s.tags.some((t) => t.norm === arg) && s.trade.result === "loss");
  } else if (family === "blank-mistakes") {
    stillPresent = since.some((s) => s.blankMistakes && (s.trade.result === "loss" || s.trade.execution_quality === "bad"));
  } else if (family === "outcome-vs-process" || family === "process-vs-outcome-perfect") {
    stillPresent = since.some((s) => s.trade.execution_quality === "good" && s.netR < 0);
  } else if (family === "score-divergence") {
    return null; // a rolling-window signal, not a single-trade event to re-check
  }

  if (stillPresent) {
    const totalStreak = patternStreak(priorSessions, prior.pattern_key) + 1;
    const text =
      totalStreak >= 4
        ? `This is the ${ordinal(totalStreak)} session in a row flagging the same pattern${label ? ` — "${label}"` : ""}. At what point does this stop being a mistake and become a habit?`
        : `Your last reflection on ${fmtDate(prior.date)} committed to: ${prior.primary_objective}. That pattern is still showing up${label ? ` — "${label}"` : ""}. What changed between making that commitment and today's execution?`;
    return { priority: 100, kind: "commitment", patternKey: prior.pattern_key, recurringLabel: label, text };
  }

  return {
    priority: 60,
    kind: "strength",
    patternKey: null,
    recurringLabel: null,
    text: `You committed to "${prior.primary_objective}" on ${fmtDate(prior.date)} — across ${since.length} trade${since.length === 1 ? "" : "s"} since, that pattern hasn't shown up again. That's held.`,
  };
}

// ── Action plan lookup ────────────────────────────────────────────────
interface ActionPlan {
  primaryObjective: string;
  reminder: string;
  successMetric: string;
}

function actionPlanFor(f: Finding): ActionPlan {
  const family = f.patternKey?.split(":")[0] ?? "";
  const label = f.recurringLabel;
  switch (family) {
    case "recurring-rule":
    case "self-contradiction":
      return {
        primaryObjective: label ? `Follow "${label}" on every trade — no exceptions.` : "Follow every rule on your checklist, no exceptions.",
        reminder: "Read the rule before you enter, not after you exit.",
        successMetric: "Zero trades that break this rule.",
      };
    case "bias-mismatch":
      return {
        primaryObjective: "Only take trades that match your pre-market bias, or log the override before you enter.",
        reminder: "A change of mind mid-session is a decision — write down why.",
        successMetric: "Zero unexplained direction flips from your own analysis.",
      };
    case "blank-mistakes":
      return {
        primaryObjective: "Write one sentence on every losing trade before you close the platform.",
        reminder: "If there's truly no mistake, write that down explicitly — don't leave it blank.",
        successMetric: "100% of losing trades have a logged mistake or an explicit reason.",
      };
    case "outcome-vs-process":
    case "process-vs-outcome-perfect":
      return {
        primaryObjective: "Rate execution on process only.",
        reminder: "A good-process trade that loses is still a good trade.",
        successMetric: "Every 'good' rating is backed by a specific rule you can name.",
      };
    case "setup-pattern":
      return {
        primaryObjective: label ? `Stand down on "${label}" until you've reviewed why it's failing.` : "Stand down on this setup until you've reviewed why it's failing.",
        reminder: "A setup with a repeating loss pattern is data, not bad luck.",
        successMetric: label ? `Zero "${label}" trades until reviewed in My Strategy.` : "Zero trades on this setup until reviewed.",
      };
    case "score-divergence":
      return {
        primaryObjective: "Re-audit whether your checklist rules actually measure what makes a trade good.",
        reminder: "A high score with a losing account means the rules and the market don't agree.",
        successMetric: "One rule added or changed based on this review.",
      };
    case "steady-state":
      return {
        primaryObjective: "Hold the current standard for one more week.",
        reminder: "Consistency is proven on the trade that looks like an exception.",
        successMetric: "Maintain the same rule-following rate on every new trade.",
      };
    default:
      return {
        primaryObjective: "Review this session's finding before your next trade.",
        reminder: "",
        successMetric: "",
      };
  }
}

// ── Report (Report) — a factual, no-judgement recap of the latest trade ─
function buildReport(latest: Signal): string {
  const t = latest.trade;
  const resultLabel = t.result === "win" ? "won" : t.result === "loss" ? "lost" : "closed break-even";
  const parts = [
    `${instrumentName(t.instrument)} ${t.direction}`,
    `${t.session} session`,
    `${resultLabel} (${fmtR(latest.netR)})`,
  ];
  if (t.execution_quality) parts.push(`execution rated ${t.execution_quality}`);
  if (latest.ruleCount > 0) parts.push(`${latest.ruleCount - latest.brokenRules.length}/${latest.ruleCount} of your rules followed`);
  return parts.join(" · ") + ".";
}

// ── Composition ───────────────────────────────────────────────────────
export const RESPONSE_TAGS = ["calm", "anxious", "euphoric", "frustrated", "rushed", "numb"] as const;

export interface PsychEdgeReflection {
  /** Report — factual recap of the latest trade, always present. */
  report: string;
  /** Relate — how this trade connects to trailing history, if it does. */
  relate: string | null;
  /** Reason — the targeted challenge question the trader answers. */
  reason: string;
  patternKey: string | null;
  recurringPatternLabel: string | null;
  primaryObjective: string | null;
  reminder: string | null;
  successMetric: string | null;
  tradeId: string;
  tradesAnalyzed: number;
}

/**
 * `priorSessions` must be sorted newest-first (as returned by
 * `getPsychEdgeSessions`). Returns null when there is no trade history yet.
 */
export function computeReflection(
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[],
  priorSessions: PsychEdgeSession[]
): PsychEdgeReflection | null {
  if (trades.length === 0) return null;

  const sorted = [...trades].sort((a, b) => a.date_time.localeCompare(b.date_time));
  const analysisById = new Map(analyses.map((a) => [a.id, a]));
  const signals = sorted.map((t) => buildSignal(t, analysisById));
  const latest = signals[signals.length - 1];

  const findings: Finding[] = [];
  const commitment = commitmentFinding(signals, priorSessions);
  if (commitment) findings.push(commitment);

  const candidates = [
    outcomeContradiction(latest),
    biasMismatchFinding(latest),
    perfectProcessFinding(latest),
    selfContradiction(latest),
    blankMistakeFinding(latest),
    recurringRuleFinding(signals),
    setupPatternFinding(signals),
    scoreDivergenceFinding(signals),
  ].filter((f): f is Finding => f !== null);
  findings.push(...candidates);

  if (findings.length === 0) {
    const fallback = steadyStateFinding(signals);
    if (fallback) findings.push(fallback);
  }

  findings.sort((a, b) => b.priority - a.priority);

  // One finding per "family" so Reason and Relate never repeat the same theme.
  const seen = new Set<string>();
  const chosen: Finding[] = [];
  for (const f of findings) {
    const family = f.patternKey?.split(":")[0] ?? f.kind;
    if (seen.has(family)) continue;
    seen.add(family);
    chosen.push(f);
    if (chosen.length >= 2) break;
  }

  const driver = chosen.find((f) => f.kind !== "strength") ?? chosen[0] ?? null;
  const secondary = chosen.find((f) => f !== driver) ?? null;
  const plan = driver ? actionPlanFor(driver) : null;

  return {
    report: buildReport(latest),
    relate: secondary?.text ?? null,
    reason: driver?.text ?? "Nothing here contradicts itself yet — keep logging so a pattern has room to show up.",
    patternKey: driver?.patternKey ?? null,
    recurringPatternLabel: driver?.recurringLabel ?? null,
    primaryObjective: plan?.primaryObjective ?? null,
    reminder: plan?.reminder ?? null,
    successMetric: plan?.successMetric ?? null,
    tradeId: latest.trade.id,
    tradesAnalyzed: signals.length,
  };
}

// ── Pre-market briefing ───────────────────────────────────────────────
// Shown before the trader takes a trade: what's carrying over from the last
// session, whether that pattern held or recurred, and a quick reminder of
// recent mistakes pulled verbatim from the journal — never re-asked, only
// recapped.
export interface PreMarketBriefing {
  hasHistory: boolean;
  objective: string | null;
  reminder: string | null;
  patternLabel: string | null;
  /** Ready-made sentence: whether the last objective held or recurred. */
  statusText: string | null;
  held: boolean | null;
  recentMistakes: { date: string; text: string }[];
}

export function buildPreMarketBriefing(
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[],
  priorSessions: PsychEdgeSession[]
): PreMarketBriefing {
  const recentMistakes = [...trades]
    .filter((t) => t.mistakes && t.mistakes.trim() !== "")
    .sort((a, b) => b.date_time.localeCompare(a.date_time))
    .slice(0, 3)
    .map((t) => ({ date: t.date_time.slice(0, 10), text: t.mistakes.trim() }));

  const prior = priorSessions[0] ?? null;
  if (!prior) {
    return { hasHistory: false, objective: null, reminder: null, patternLabel: null, statusText: null, held: null, recentMistakes };
  }

  let statusText: string | null = null;
  let held: boolean | null = null;
  if (trades.length > 0) {
    const sorted = [...trades].sort((a, b) => a.date_time.localeCompare(b.date_time));
    const analysisById = new Map(analyses.map((a) => [a.id, a]));
    const signals = sorted.map((t) => buildSignal(t, analysisById));
    const check = commitmentFinding(signals, priorSessions);
    if (check) {
      statusText = check.text;
      held = check.kind === "strength";
    }
  }

  return {
    hasHistory: true,
    objective: prior.primary_objective,
    reminder: prior.reminder,
    patternLabel: prior.recurring_pattern_label,
    statusText,
    held,
    recentMistakes,
  };
}
