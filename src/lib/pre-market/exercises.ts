import type { CommitmentFormat, ExerciseTypeId, TradeJournalEntry } from "@/lib/types";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";

export type ExerciseField = {
  id: string;
  label: string;
  prompt: string;
  kind: "text" | "textarea" | "number" | "choice" | "trade_review" | "scale" | "list";
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  tradeResult?: "win" | "loss";
  /** trade_review: how many trades; list: how many lines. */
  count?: number;
  placeholder?: string;
  /** scale: the words under 1 and 5. */
  scaleLabels?: readonly [string, string];
};

/**
 * Routine: any day. Recovery: after red sessions. Profile: built on a focus
 * area from My Trade Profile (the Big Five assessment), so it trains the trait
 * the trader chose to work on.
 */
export type ExerciseCategory = "routine" | "recovery" | "profile";

export type PreMarketExerciseDefinition = {
  id: ExerciseTypeId;
  title: string;
  /** One line on why, shown under the title. */
  rationale: string;
  category: ExerciseCategory;
  /** Rough minutes, shown on the card. */
  minutes: number;
  /** For profile exercises: the My Trade Profile focus area it trains. */
  focusArea?: FocusAreaId;
  /** The technique behind it, in a few words. */
  technique: string;
  suggestedCommitmentFormat: CommitmentFormat;
  commitmentPrompt: string;
  commitmentTemplate: string;
  /** Short example focuses for step two, one tap to use. */
  focusIdeas: readonly string[];
  fields: readonly ExerciseField[];
};

export const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  routine: "Routine",
  recovery: "After losses",
  profile: "From your Trade Profile",
};

export const PRE_MARKET_EXERCISES: readonly PreMarketExerciseDefinition[] = [
  // ── Routine ─────────────────────────────────────────────────────────────────
  {
    id: "loss_win_review",
    title: "Loss & win review",
    rationale: "Carry one lesson from recent losses and one repeatable strength from recent wins into today.",
    category: "routine",
    minutes: 6,
    technique: "Structured review",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Turn the most important lesson into one commitment for today.",
    commitmentTemplate: "Today I will [specific action] so I do not repeat [mistake].",
    focusIdeas: ["Only take the setup from my plan.", "Let the stop do its job.", "Size down after a loss."],
    fields: [
      { id: "loss_plans", label: "Prevent these losses", prompt: "How will you prevent this today?", kind: "trade_review", tradeResult: "loss", count: 2 },
      { id: "win_plans", label: "Repeat these wins", prompt: "How will you repeat this today?", kind: "trade_review", tradeResult: "win", count: 2 },
    ],
  },
  {
    id: "mental_contrasting",
    title: "Mental contrasting",
    rationale: "Name the result you want and the internal obstacle most likely to pull you away from it.",
    category: "routine",
    minutes: 4,
    technique: "WOOP",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Connect the obstacle to one action. IF/THEN is a suggestion, not a restriction.",
    commitmentTemplate: "If [internal obstacle] shows up, then I will [specific action].",
    focusIdeas: ["Patience until my level.", "One clean execution.", "No revenge trades."],
    fields: [
      { id: "desired_outcome", label: "Outcome", prompt: "What outcome do you want from your process today?", kind: "textarea", required: true, placeholder: "Patient execution of my A+ setup." },
      { id: "internal_obstacle", label: "Internal obstacle", prompt: "What thought, feeling or impulse is most likely to block it?", kind: "textarea", required: true, placeholder: "Wanting to make back yesterday's loss quickly." },
    ],
  },
  {
    id: "pre_mortem",
    title: "Pre-mortem",
    rationale: "Imagine the session already went wrong, then find the first sign of it so you can stop it early.",
    category: "routine",
    minutes: 5,
    technique: "Prospective hindsight",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Tie the earliest warning sign to what you will do the moment you see it.",
    commitmentTemplate: "If I notice [first warning sign], then I will [stop action].",
    focusIdeas: ["Catch the first warning sign.", "Stop after two losses.", "Stay flat before the news."],
    fields: [
      { id: "failure_story", label: "It went badly", prompt: "It is the close and today went badly. Write what happened, as if it already did.", kind: "textarea", required: true, placeholder: "I chased the open, took a loss, then doubled size to get it back." },
      { id: "first_sign", label: "The first sign", prompt: "What would be the very first thing you would notice if this story started?", kind: "textarea", required: true, placeholder: "Clicking buy before my checklist is done." },
    ],
  },
  {
    id: "mental_rehearsal",
    title: "Mental rehearsal",
    rationale: "Walk through your best setup step by step, so the real trade feels familiar when it comes.",
    category: "routine",
    minutes: 5,
    technique: "Mental rehearsal",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Commit to the one step you are most likely to skip.",
    commitmentTemplate: "Every entry today goes through [step], even when it feels obvious.",
    focusIdeas: ["Execute it exactly as rehearsed.", "Wait for the confirmation.", "Manage the trade, not the P&L."],
    fields: [
      { id: "setup", label: "The setup", prompt: "Which setup are you rehearsing?", kind: "text", required: true, placeholder: "Opening range break and retest" },
      { id: "walkthrough", label: "Walk through it", prompt: "From the alert to the exit: what do you see, what do you check, what do you click?", kind: "textarea", required: true, placeholder: "Price breaks the range, I wait for the retest candle to close, I check volume, then I enter with the stop below the level." },
      { id: "hardest_moment", label: "The hardest moment", prompt: "Where in that trade is it hardest to stick to the plan?", kind: "textarea", required: true, placeholder: "When it goes against me right after entry." },
    ],
  },
  {
    id: "rules_recall",
    title: "Rules from memory",
    rationale: "Write your key rules without looking. What you cannot recall, you will not follow under pressure.",
    category: "routine",
    minutes: 3,
    technique: "Retrieval practice",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Protect the rule that is most at risk today.",
    commitmentTemplate: "Today I keep [rule], no exceptions.",
    focusIdeas: ["Respect my risk rule.", "No trades outside my hours.", "Checklist before every entry."],
    fields: [
      { id: "rules", label: "Your three key rules", prompt: "From memory, no peeking.", kind: "list", count: 3, required: true, placeholder: "Rule" },
      { id: "at_risk", label: "Most at risk today", prompt: "Which of these is most likely to break today, and why?", kind: "textarea", required: true, placeholder: "The daily loss limit: I slept badly and I feel impatient." },
    ],
  },
  {
    id: "state_check",
    title: "State check",
    rationale: "Rate how you actually arrive at the screen today, and let that set your size and scope.",
    category: "routine",
    minutes: 2,
    technique: "Self-monitoring",
    suggestedCommitmentFormat: "scope",
    commitmentPrompt: "Match today's scope to the state you rated.",
    commitmentTemplate: "Given how I feel, today I trade [size] and stop after [limit].",
    focusIdeas: ["Trade smaller today.", "Take breaks between trades.", "Only A+ setups."],
    fields: [
      { id: "sleep", label: "Sleep", prompt: "How rested are you?", kind: "scale", required: true, scaleLabels: ["Exhausted", "Fully rested"] },
      { id: "energy", label: "Energy", prompt: "How sharp do you feel?", kind: "scale", required: true, scaleLabels: ["Foggy", "Sharp"] },
      { id: "calm", label: "Calm", prompt: "How settled are you emotionally?", kind: "scale", required: true, scaleLabels: ["Wound up", "Settled"] },
      { id: "meaning", label: "What it means", prompt: "What do these numbers mean for how you trade today?", kind: "textarea", required: true, placeholder: "Low sleep: half size and no trades in the first 15 minutes." },
    ],
  },
  {
    id: "scenario_plan",
    title: "Two scenarios",
    rationale: "Decide in advance what you do in either direction, and what would make today a no-trade day.",
    category: "routine",
    minutes: 6,
    technique: "Scenario planning",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Write the plan for the scenario you are most tempted to improvise in.",
    commitmentTemplate: "If price [scenario], then I [action]. Otherwise I stay flat.",
    focusIdeas: ["Trade the plan, not the prediction.", "Accept a no-trade day.", "Wait for my level in either direction."],
    fields: [
      { id: "up_case", label: "If it goes up", prompt: "What would you need to see, and what will you do?", kind: "textarea", required: true, placeholder: "Acceptance above yesterday's high: look for a long on the retest." },
      { id: "down_case", label: "If it goes down", prompt: "What would you need to see, and what will you do?", kind: "textarea", required: true, placeholder: "Break of the overnight low: short the first pullback." },
      { id: "no_trade", label: "No-trade day", prompt: "What would make today a day to stay flat?", kind: "textarea", required: true, placeholder: "Chop inside the overnight range into the news." },
    ],
  },
  // ── Recovery ────────────────────────────────────────────────────────────────
  {
    id: "post_loss_reset",
    title: "Post-loss reset",
    rationale: "After consecutive red sessions, reduce scope and separate a valid setup from the urge to be right.",
    category: "recovery",
    minutes: 3,
    technique: "Scope reduction",
    suggestedCommitmentFormat: "scope",
    commitmentPrompt: "Write the reduced scope you will actually respect today.",
    commitmentTemplate: "Today I will take no more than [max trades] and risk no more than [max risk].",
    focusIdeas: ["Smaller and slower.", "One good trade is enough.", "Stop at my limit, no debate."],
    fields: [
      { id: "recovering", label: "What are you recovering?", prompt: "Be honest about what you are trying to get back.", kind: "choice", required: true, options: [{ value: "setup", label: "Trust in the setup" }, { value: "feeling", label: "The feeling of being right" }] },
      { id: "max_trades", label: "Maximum trades", prompt: "Set a hard trade cap.", kind: "number", required: true, placeholder: "2" },
      { id: "max_risk", label: "Maximum risk", prompt: "Set the maximum total risk for today.", kind: "text", required: true, placeholder: "0.5R total" },
    ],
  },
  // ── From My Trade Profile (one per Big Five focus area) ─────────────────────
  {
    id: "calm_plan",
    title: "Calm under pressure",
    rationale: "Plan the moment your stress is most likely to spike, and what your body does when it comes.",
    category: "profile",
    focusArea: "calm",
    minutes: 4,
    technique: "Reappraisal and if-then plan",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Link the stress moment to one physical action.",
    commitmentTemplate: "If I feel [stress signal], then I breathe out once and [action] before I touch the order.",
    focusIdeas: ["Breathe before every exit.", "Let the stop decide.", "Step away after a loss."],
    fields: [
      { id: "tension", label: "Tension right now", prompt: "How tense do you feel before the open?", kind: "scale", required: true, scaleLabels: ["Calm", "Very tense"] },
      { id: "spike", label: "The spike", prompt: "Which moment today is most likely to make your stress jump?", kind: "textarea", required: true, placeholder: "A fast move against me right after entry." },
      { id: "reframe", label: "Another true way to see it", prompt: "When it happens, what is a calmer and still true way to see it?", kind: "textarea", required: true, placeholder: "It is a planned 1R risk, one trade of the next hundred." },
    ],
  },
  {
    id: "impulse_gate",
    title: "Impulse gate",
    rationale: "Put a short, fixed check between the urge to trade and the click.",
    category: "profile",
    focusArea: "impulse",
    minutes: 4,
    technique: "Implementation intention",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Make the gate a rule you can check yourself against tonight.",
    commitmentTemplate: "No entry today unless it passes all [number] checks, said out loud.",
    focusIdeas: ["Count to ten before I click.", "No chasing a move I missed.", "Max trades, then I stop."],
    fields: [
      { id: "trigger", label: "Your last impulse trade", prompt: "When did you last enter without a plan, and what set it off?", kind: "textarea", required: true, placeholder: "Yesterday, a big green candle and the fear of missing it." },
      { id: "gate", label: "Three checks before every entry", prompt: "Short enough to say out loud in ten seconds.", kind: "list", count: 3, required: true, placeholder: "Check" },
    ],
  },
  {
    id: "follow_through",
    title: "One promise",
    rationale: "Pick one routine and decide exactly when and where it happens, so it does not depend on mood.",
    category: "profile",
    focusArea: "followThrough",
    minutes: 3,
    technique: "Implementation intention",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Anchor the promise to a moment that happens every day anyway.",
    commitmentTemplate: "When [daily moment], I [routine], before anything else.",
    focusIdeas: ["Keep the one promise.", "Review every trade today.", "Follow the routine, not the mood."],
    fields: [
      { id: "promise", label: "The promise", prompt: "Which one routine will you complete today?", kind: "text", required: true, placeholder: "Write a review for every trade" },
      { id: "when", label: "When and where", prompt: "Exactly when and where will you do it?", kind: "textarea", required: true, placeholder: "Right after my last trade, at my desk, before I close the platform." },
      { id: "skip", label: "What usually stops you", prompt: "What makes you skip it, and how will you get around that today?", kind: "textarea", required: true, placeholder: "I am tired after the session. I will do a two-line version instead of nothing." },
    ],
  },
  {
    id: "thrill_outlet",
    title: "Quiet market plan",
    rationale: "Decide where your need for excitement goes today, so trading can stay boring on purpose.",
    category: "profile",
    focusArea: "thrill",
    minutes: 3,
    technique: "Channelling",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Plan what you do when the market goes quiet.",
    commitmentTemplate: "If the market is slow and I feel restless, then I [outlet] instead of taking a trade.",
    focusIdeas: ["Boring is the goal.", "No trades out of boredom.", "Wait for my setup, not for action."],
    fields: [
      { id: "signal", label: "Your boredom signal", prompt: "How do you notice that you want action rather than a setup?", kind: "textarea", required: true, placeholder: "I start scrolling lower timeframes looking for something." },
      { id: "outlet", label: "Somewhere else for it", prompt: "Where will you get some excitement today outside your P&L?", kind: "textarea", required: true, placeholder: "A hard workout at lunch." },
      { id: "quiet_rule", label: "Your quiet-market rule", prompt: "One rule for slow sessions.", kind: "text", required: true, placeholder: "Under average volume: no new trades." },
    ],
  },
  {
    id: "idea_parking",
    title: "Idea parking lot",
    rationale: "Keep your curiosity, but park new ideas until the weekend so today's setup gets a fair test.",
    category: "profile",
    focusArea: "curiosity",
    minutes: 3,
    technique: "Goal shielding",
    suggestedCommitmentFormat: "rule",
    commitmentPrompt: "Commit to the one approach you test today.",
    commitmentTemplate: "Today I only trade [setup]. New ideas go in the parking lot.",
    focusIdeas: ["One setup, one sample.", "Park new ideas.", "Build the sample size."],
    fields: [
      { id: "setup", label: "Today's one setup", prompt: "The single approach you will trade today.", kind: "text", required: true, placeholder: "London open breakout" },
      { id: "sample", label: "Sample so far", prompt: "How many trades of this setup have you logged?", kind: "number", required: true, placeholder: "18" },
      { id: "parked", label: "Parked ideas", prompt: "New ideas you will look at in the weekend review, not today.", kind: "list", count: 3, placeholder: "Idea" },
    ],
  },
  {
    id: "evidence_file",
    title: "Evidence file",
    rationale: "Collect proof that you can execute your plan, then act on your analysis without waiting for certainty.",
    category: "profile",
    focusArea: "selfTrust",
    minutes: 4,
    technique: "Self-efficacy building",
    suggestedCommitmentFormat: "if_then",
    commitmentPrompt: "Plan the moment you are most likely to hesitate.",
    commitmentTemplate: "If my setup is valid and I hesitate, then I [act] within [seconds] seconds.",
    focusIdeas: ["Trust my analysis.", "Valid setup means I enter.", "My stop stays where I put it."],
    fields: [
      { id: "evidence", label: "Three times you did it well", prompt: "Recent moments you executed your plan as written.", kind: "list", count: 3, required: true, placeholder: "Moment" },
      { id: "hesitation", label: "Where you hesitate", prompt: "Where are you most likely to doubt yourself today?", kind: "textarea", required: true, placeholder: "Entering after two losses in a row." },
    ],
  },
] as const;

export function exerciseDefinition(id: ExerciseTypeId): PreMarketExerciseDefinition {
  return PRE_MARKET_EXERCISES.find((exercise) => exercise.id === id) ?? PRE_MARKET_EXERCISES[0];
}

/** The profile exercise that trains a My Trade Profile focus area, if there is one. */
export function exerciseForFocusArea(area: FocusAreaId | null | undefined): PreMarketExerciseDefinition | undefined {
  return area ? PRE_MARKET_EXERCISES.find((exercise) => exercise.focusArea === area) : undefined;
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

/**
 * Today's suggestion. Two red sessions in a row come first (post-loss reset).
 * Otherwise, a trader with a My Trade Profile focus gets the exercise for that
 * area, unless they did it last time; then the routine pair alternates.
 */
export function selectExercise(
  sessions: SessionResult[],
  mostRecentlyUsed?: ExerciseTypeId | null,
  focusArea?: FocusAreaId | null,
): ExerciseTypeId {
  if (sessions.length >= 2 && sessions[0].netR < 0 && sessions[1].netR < 0) return "post_loss_reset";
  const profile = exerciseForFocusArea(focusArea);
  if (profile && mostRecentlyUsed !== profile.id) return profile.id;
  return mostRecentlyUsed === "loss_win_review" ? "mental_contrasting" : "loss_win_review";
}
