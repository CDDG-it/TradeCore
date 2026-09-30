import type { CommitmentFormat, ExerciseTypeId, TradeJournalEntry } from "@/lib/types";

export type ExerciseField = {
  id: string;
  label: string;
  prompt: string;
  kind: "text" | "textarea" | "number" | "choice" | "trade_review";
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  tradeResult?: "win" | "loss";
  count?: number;
  placeholder?: string;
};

export type PreMarketExerciseDefinition = {
  id: ExerciseTypeId;
  title: string;
  rationale: string;
  suggestedCommitmentFormat: CommitmentFormat;
  commitmentPrompt: string;
  commitmentTemplate: string;
  fields: readonly ExerciseField[];
};

export const PRE_MARKET_EXERCISES: readonly PreMarketExerciseDefinition[] = [
  {
    id: "loss_win_review",
    title: "Loss & win review",
    rationale: "Carry one lesson from recent losses and one repeatable strength from recent wins into today.",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Turn the most important lesson into one commitment for today.",
    commitmentTemplate: "Today I will [specific action] so I do not repeat [mistake].",
    fields: [
      { id: "loss_plans", label: "Prevent these losses", prompt: "How will you prevent this today?", kind: "trade_review", tradeResult: "loss", count: 2 },
      { id: "win_plans", label: "Repeat these wins", prompt: "How will you repeat this today?", kind: "trade_review", tradeResult: "win", count: 2 },
    ],
  },
  {
    id: "mental_contrasting",
    title: "Mental contrasting",
    rationale: "Name the result you want and the internal obstacle most likely to pull you away from it.",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Connect the obstacle to one action. IF/THEN is a suggestion, not a restriction.",
    commitmentTemplate: "If [internal obstacle] shows up, then I will [specific action].",
    fields: [
      { id: "desired_outcome", label: "Outcome", prompt: "What outcome do you want from your process today?", kind: "textarea", required: true, placeholder: "Patient execution of my A+ setup." },
      { id: "internal_obstacle", label: "Internal obstacle", prompt: "What thought, feeling or impulse is most likely to block it?", kind: "textarea", required: true, placeholder: "Wanting to make back yesterday's loss quickly." },
    ],
  },
  {
    id: "post_loss_reset",
    title: "Post-loss reset",
    rationale: "After consecutive red sessions, reduce scope and separate a valid setup from the urge to be right.",
    suggestedCommitmentFormat: "scope",
    commitmentPrompt: "Write the reduced scope you will actually respect today.",
    commitmentTemplate: "Today I will take no more than [max trades] and risk no more than [max risk].",
    fields: [
      { id: "recovering", label: "What are you recovering?", prompt: "Be honest about what you are trying to get back.", kind: "choice", required: true, options: [{ value: "setup", label: "Trust in the setup" }, { value: "feeling", label: "The feeling of being right" }] },
      { id: "max_trades", label: "Maximum trades", prompt: "Set a hard trade cap.", kind: "number", required: true, placeholder: "2" },
      { id: "max_risk", label: "Maximum risk", prompt: "Set the maximum total risk for today.", kind: "text", required: true, placeholder: "0.5R total" },
    ],
  },
] as const;

export function exerciseDefinition(id: ExerciseTypeId): PreMarketExerciseDefinition {
  return PRE_MARKET_EXERCISES.find((exercise) => exercise.id === id) ?? PRE_MARKET_EXERCISES[0];
}

export type SessionResult = { date: string; session: string; netR: number };

export function aggregateSessions(trades: Pick<TradeJournalEntry, "date_time" | "session" | "result" | "rr">[]): SessionResult[] {
  const totals = new Map<string, SessionResult>();
  for (const trade of trades) {
    const date = trade.date_time.slice(0, 10);
    const key = `${date}:${trade.session}`;
    const r = trade.result === "win" ? trade.rr : trade.result === "loss" ? -1 : 0;
    const current = totals.get(key) ?? { date, session: trade.session, netR: 0 };
    current.netR += r;
    totals.set(key, current);
  }
  return [...totals.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function selectExercise(
  sessions: SessionResult[],
  mostRecentlyUsed?: ExerciseTypeId | null,
): ExerciseTypeId {
  if (sessions.length >= 2 && sessions[0].netR < 0 && sessions[1].netR < 0) return "post_loss_reset";
  return mostRecentlyUsed === "loss_win_review" ? "mental_contrasting" : "loss_win_review";
}
