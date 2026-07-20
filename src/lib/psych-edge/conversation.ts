/**
 * MC Trade Therapist, the conversation script.
 *
 * Turns a FiveRContext into a back-and-forth session: the therapist speaks (one
 * or more message blocks, always grounded in the trader's own trade and stats),
 * asks one reflective question, and waits for a reply. Every line is chosen
 * deterministically from the data and from what the trader has already said —
 * there is no generative model and no generic coaching filler.
 *
 * The whole thread is a pure function of (context, answers), so the UI can
 * re-derive it on every render and resume a half-finished session from storage.
 */
import { format, parse } from "date-fns";
import { instrumentName } from "@/lib/journal/weeks";
import { PATTERN_LABELS } from "@/lib/psych-edge/patterns";
import type { FiveRContext } from "@/lib/psych-edge/therapist";
import type { DetectedPattern, PatternStat } from "@/lib/psych-edge/patterns";
import type { TradeJournalEntry, PsychEdgeResponseTag } from "@/lib/types";

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const fmtDay = (iso: string) => format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), "MMM d");
const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export const TAG_LABEL: Record<PsychEdgeResponseTag, string> = {
  calm: "Calm", anxious: "Anxious", euphoric: "Euphoric",
  frustrated: "Frustrated", rushed: "Rushed", numb: "Numb",
};
export const INTENSITY_LABEL = ["Barely there", "Mild", "Noticeable", "Strong", "Overwhelming"];

/** Everything the trader can say back, accumulated across the session. */
export interface Answers {
  openingThought?: string;
  tag?: PsychEdgeResponseTag;
  intensity?: number;
  emotionReflect?: string;
  /** Relating: did they recognise the pattern? (only when a pattern was detected) */
  confirmed?: boolean;
  commonThread?: string;
  whatDifferent?: string;
  trigger?: string;
  action?: string;
  sealed?: boolean;
}

export type TextKey = "openingThought" | "emotionReflect" | "commonThread" | "whatDifferent";

// ── Message blocks the therapist can show ───────────────────────────────
export type Block =
  | { kind: "text"; text: string }
  | { kind: "trade"; trade: TradeJournalEntry; netR: number }
  | { kind: "pattern"; pattern: DetectedPattern }
  | { kind: "prior"; prior: DetectedPattern }
  | { kind: "cost"; stat: PatternStat; occurrences: { date: string; r: number; instrument: string; isFocus: boolean }[] };

// ── What the trader does next ───────────────────────────────────────────
export type Input =
  | { kind: "emotion" }
  | { kind: "intensity" }
  | { kind: "confirm" }
  | { kind: "text"; key: TextKey; placeholder: string }
  | { kind: "ifthen" };

export interface Exchange {
  id: string;
  /** The therapist's turn. */
  blocks: Block[];
  /** The trader's turn. Absent on the closing statement. */
  input?: Input;
  /** The answers key this exchange is waiting on (drives "answered?"). */
  waitKey?: keyof Answers;
  /** The user-bubble text once answered. */
  echo?: string;
}

// ── Reflective question banks (deterministic, grounded, never generic) ──
function emotionReflectQ(tag: PsychEdgeResponseTag): string {
  switch (tag) {
    case "frustrated": return "Frustration usually pushes people toward the next trade. Did you feel that pull today, and if so, at what exact moment?";
    case "anxious": return "Anxiety either shrinks people or makes them reckless. Which way did it take you on this one?";
    case "euphoric": return "Euphoria after a run is the dangerous one. Be honest with me, did it colour how you read this trade?";
    case "calm": return "You were calm, and it still went this way. Does that point at the setup itself rather than your state?";
    case "rushed": return "Rushed, where was the time pressure actually coming from: the market, or you?";
    case "numb": return "Numb is a signal too, not the absence of one. When in the session did that set in?";
  }
}

function openerQ(ctx: FiveRContext): string {
  const r = fmtR(ctx.netR);
  if (ctx.trade.result === "loss") return `You closed it at ${r}. Before we get to the why, what was going through your head the moment you decided to take it?`;
  if (ctx.trade.execution_quality === "bad") return `It came in at ${r}, but you rated the execution bad yourself. What felt off, even though the number worked out?`;
  return `It closed ${r}. What made you want to sit down and look at this one again?`;
}

// ── Build the whole thread from context + answers ───────────────────────
export function buildConversation(
  ctx: FiveRContext,
  answers: Answers,
  trades: TradeJournalEntry[]
): Exchange[] {
  const a = answers;
  const ex: Exchange[] = [];
  const tradeById = new Map(trades.map((t) => [t.id, t]));

  // 1, Reporting + opener
  ex.push({
    id: "open",
    blocks: [
      { kind: "text", text: "Let's look at this trade together. Here's exactly what your journal recorded, nothing added." },
      { kind: "trade", trade: ctx.trade, netR: ctx.netR },
      { kind: "text", text: openerQ(ctx) },
    ],
    input: { kind: "text", key: "openingThought", placeholder: "Say it plainly…" },
    waitKey: "openingThought",
    echo: a.openingThought,
  });

  // 2, Responding: name the emotion
  ex.push({
    id: "emotion",
    blocks: [{ kind: "text", text: "Thank you, that's honest. Can you put one name to the feeling that was running underneath it?" }],
    input: { kind: "emotion" },
    waitKey: "tag",
    echo: a.tag ? TAG_LABEL[a.tag] : undefined,
  });

  // 3, Responding: intensity
  if (a.tag) {
    ex.push({
      id: "intensity",
      blocks: [{ kind: "text", text: `And how strong was that ${lower(TAG_LABEL[a.tag])}, one to five?` }],
      input: { kind: "intensity" },
      waitKey: "intensity",
      echo: a.intensity ? `${a.intensity}/5, ${INTENSITY_LABEL[a.intensity - 1]}` : undefined,
    });
  }

  // 4, Responding: reflect on the emotion
  if (a.tag && a.intensity) {
    ex.push({
      id: "emotionReflect",
      blocks: [{ kind: "text", text: emotionReflectQ(a.tag) }],
      input: { kind: "text", key: "emotionReflect", placeholder: "Take a moment with it…" },
      waitKey: "emotionReflect",
      echo: a.emotionReflect,
    });
  }

  const emotionDone = !!(a.tag && a.intensity && a.emotionReflect);

  if (emotionDone) {
    if (ctx.driver) {
      // 5, Relating: show the pattern + a comparable past occurrence
      const relBlocks: Block[] = [
        { kind: "text", text: "I want to show you something I keep seeing in your data, not a verdict, just a pattern." },
        { kind: "pattern", pattern: ctx.driver },
      ];
      if (ctx.prior) relBlocks.push({ kind: "prior", prior: ctx.prior });
      relBlocks.push({
        kind: "text",
        text: ctx.prior
          ? `The nearest time before was ${fmtDay(ctx.prior.date)}. Does today feel like the same move to you, or am I reaching?`
          : `${ctx.driver.detail} Is that a fair read of what happened?`,
      });
      ex.push({
        id: "relate",
        blocks: relBlocks,
        input: { kind: "confirm" },
        waitKey: "confirmed",
        echo: a.confirmed === undefined ? undefined : a.confirmed ? "Yes, that's it" : "No, this one's different",
      });

      if (a.confirmed === true) {
        // 6a, Reasoning: cumulative cost, with the actual trades listed
        if (ctx.stat) {
          const occ = ctx.driverHistory.map((e) => ({
            date: e.date,
            r: e.rImpact,
            instrument: instrumentName(tradeById.get(e.tradeId)?.instrument ?? ""),
            isFocus: e.tradeId === ctx.trade.id,
          }));
          ex.push({
            id: "cost",
            blocks: [
              { kind: "text", text: "Then let me put the whole picture in front of you, so it's not just a feeling." },
              { kind: "cost", stat: ctx.stat, occurrences: occ },
              { kind: "text", text: `That's ${ctx.stat.count} time${ctx.stat.count === 1 ? "" : "s"} now, ${fmtR(ctx.stat.cumulativeR)} together. Seeing the run laid out like that, what's the one thing you keep repeating each time?` },
            ],
            input: { kind: "text", key: "commonThread", placeholder: "The common thread…" },
            waitKey: "commonThread",
            echo: a.commonThread,
          });
        }
        // 7a, what was different today
        if (a.commonThread) {
          ex.push({
            id: "different",
            blocks: [{ kind: "text", text: "And today specifically, was it the same trigger as those, or did something genuinely change this time?" }],
            input: { kind: "text", key: "whatDifferent", placeholder: "Same, or different, and how…" },
            waitKey: "whatDifferent",
            echo: a.whatDifferent,
          });
        }
      } else if (a.confirmed === false) {
        // 6b, refuted: honour it, ask what makes it different
        ex.push({
          id: "different",
          blocks: [{ kind: "text", text: `Fair enough, I won't pin a label on it you don't agree with. So what makes this one different from ${ctx.prior ? fmtDay(ctx.prior.date) : "the others"}?` }],
          input: { kind: "text", key: "whatDifferent", placeholder: "What sets it apart…" },
          waitKey: "whatDifferent",
          echo: a.whatDifferent,
        });
      }
    } else {
      // No pattern, that's information too
      ex.push({
        id: "different",
        blocks: [
          { kind: "text", text: "I'm not seeing a repeating pattern behind this one, and honestly, that's worth noticing in itself." },
          { kind: "text", text: "So let's make it yours: what do you want to carry forward from this trade?" },
        ],
        input: { kind: "text", key: "whatDifferent", placeholder: "What you want to keep…" },
        waitKey: "whatDifferent",
        echo: a.whatDifferent,
      });
    }
  }

  // 8, Reconstructing: the if-then commitment
  if (a.whatDifferent) {
    ex.push({
      id: "reconstruct",
      blocks: [{ kind: "text", text: "Let's anchor it, nothing grand, one if-then you'll actually recognise when it matters. I'll bring it back to you before the next time this setup lines up." }],
      input: { kind: "ifthen" },
      waitKey: "sealed",
      echo: a.sealed && a.trigger && a.action ? `If ${a.trigger}, then ${a.action}.` : undefined,
    });
  }

  // 9, Closing
  if (a.sealed && a.trigger && a.action) {
    ex.push({
      id: "close",
      blocks: [{ kind: "text", text: `That's enough for today. I've saved it, if ${a.trigger}, then ${a.action}, and I'll put it back in front of you the moment the signals line up again. Good work sitting with this one.` }],
    });
  }

  return ex;
}

export { fmtR as convFmtR, fmtDay as convFmtDay };
