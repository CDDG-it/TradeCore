import type { TraderLevelSlug } from "@/lib/landing/nav";

/**
 * One page per trader level: what that stage is about, and what each of the
 * four products does for it. House style: plain language, trader-first, no
 * filler, no dashes.
 */
export type TraderLevel = {
  slug: TraderLevelSlug;
  label: string;
  /** Page title and the hero headline. */
  headline: string;
  /** The stage in one honest paragraph. */
  standfirst: string;
  /** What this stage needs, in three short lines. */
  needs: string[];
  /** Each product, in the order it matters at this stage. */
  products: {
    name: string;
    /** Anchor on the landing page that shows it. */
    href: string;
    icon: "dashboard" | "edge" | "therapist" | "markets";
    /** What the product does for a trader at this stage. */
    body: string;
    points: string[];
  }[];
  /** The closing line above the call to action. */
  close: string;
};

export const TRADER_LEVEL_PAGES: TraderLevel[] = [
  {
    slug: "starting-out",
    label: "Starting out",
    headline: "Build the routine before the results.",
    standfirst:
      "The first months are not about the P&L. They are about learning to show up the same way every day: a written plan, one focus, a habit kept. TradingMC gives that routine a home so the good days are repeatable and the bad ones are readable.",
    needs: ["A plan written before the open, not after the close.", "Habits you can see yourself keep, day after day.", "A review that asks better questions than \"why did I lose\"."],
    products: [
      {
        name: "My Edge", href: "/#the-approach", icon: "edge",
        body: "Turn the vague intention to trade well into one written plan, a handful of commitments and a short daily routine.",
        points: ["Write the trading plan once and keep it in front of you.", "Track three habits: plan written, last trade reviewed, pause after a loss.", "MC Mindscore shows the routine forming before the results do."],
      },
      {
        name: "MC Trade Therapist", href: "/#trade-therapist", icon: "therapist",
        body: "Pre-market exercises look back at your last losses and wins, then ask what you will repeat and what you will interrupt today.",
        points: ["Today's one focus, written before the open.", "After the market: examine the decisions, not the balance.", "The best trade of the day teaches you what \"on plan\" looks like."],
      },
      {
        name: "All in one dashboard", href: "/#dashboard", icon: "dashboard",
        body: "The whole day on one screen: habits, this week's trades, capital and your score. Nothing hides in a tab.",
        points: ["Log a trade or start an analysis from the desk.", "See the week fill in as you keep the routine.", "Works the same on a phone as on the desk."],
      },
      {
        name: "Global Markets dashboard", href: "/#market-context", icon: "markets",
        body: "Know which release could move your instrument before you sit down, so you are never surprised mid trade.",
        points: ["The week's calendar with the releases that matter.", "Plan notes beside each event: no entry before the print.", "Context that informs the plan without rewriting it."],
      },
    ],
    close: "You do not need more setups yet. You need a process you can keep. Start there.",
  },
  {
    slug: "developing",
    label: "Developing",
    headline: "You have a setup. Now execute it the same way every time.",
    standfirst:
      "The edge exists on paper. The gap is between the plan and the entries you actually take: the early one after a loss, the size that crept up, the level you skipped. TradingMC measures that gap and turns it into one commitment at a time.",
    needs: ["Execution measured against the written plan, not the outcome.", "Recurring mistakes turned into specific if-then commitments.", "A score that moves when the behaviour moves."],
    products: [
      {
        name: "My Edge", href: "/#the-approach", icon: "edge",
        body: "Commitments with a trigger and a response, habits tracked daily, and a goal like execution rate 75% to 85% that you can actually influence.",
        points: ["If a loss, then wait for fresh confirmation before the next entry.", "MC Mindscore weights rule adherence and execution heaviest.", "Goals measure process, so a good week is a week on plan."],
      },
      {
        name: "MC Trade Therapist", href: "/#trade-therapist", icon: "therapist",
        body: "Every session ends with a verdict: was your trade the best trade on offer? If not, why was the other one better?",
        points: ["Best trade of the day, side by side with the trade you took.", "Weekly review writes the lesson down in your own words.", "Monthly rollups show which patterns persist."],
      },
      {
        name: "All in one dashboard", href: "/#dashboard", icon: "dashboard",
        body: "Win rate next to execution rate, so a profitable week that broke the plan reads as what it was.",
        points: ["Net R and execution on the same card.", "Each day marked good or bad execution, not just green or red.", "Goals progress visible every morning."],
      },
      {
        name: "Global Markets dashboard", href: "/#market-context", icon: "markets",
        body: "Positioning, yields and the calendar give your setup its context: the same level trades differently into a rate decision.",
        points: ["COT positioning for the contracts you trade.", "The rates backdrop in three numbers.", "Your plan status sits beside all of it and does not move."],
      },
    ],
    close: "Consistency is a measurement problem before it is a discipline problem. Measure it.",
  },
  {
    slug: "profitable",
    label: "Profitable",
    headline: "Protect the edge you built.",
    standfirst:
      "Profitable traders do not fail on strategy. They drift: a rule bent on a good run, a review skipped in a busy month, size that outgrows the plan. TradingMC keeps the review cadence that catches drift early, and shows the trend before the account does.",
    needs: ["A review cadence that survives a busy month.", "Early warning when execution slips while results still look fine.", "Records that make the edge explainable to yourself."],
    products: [
      {
        name: "MC Trade Therapist", href: "/#trade-therapist", icon: "therapist",
        body: "Daily, weekly and monthly reflection with a fixed shape, so the review happens even when the week did not feel like it needed one.",
        points: ["The best trade verdict flags the good result that was not the best trade.", "Weekly lessons roll into a monthly view of what persists.", "Pre-market exercises keep recent wins and losses in front of you."],
      },
      {
        name: "My Edge", href: "/#the-approach", icon: "edge",
        body: "MC Mindscore trends by week and month, so a slide in rule adherence shows up as a number, weeks before it shows up as a drawdown.",
        points: ["Five weighted parts, each one explainable.", "Commitments stay specific: after a loss, wait for confirmation.", "Habits keep the routine honest on the easy days too."],
      },
      {
        name: "All in one dashboard", href: "/#dashboard", icon: "dashboard",
        body: "Capital across accounts, the week at a glance, and the score, without opening five tools before the bell.",
        points: ["Active capital and account count in one card.", "Week strip with results and execution quality per day.", "The week ahead pulled from the calendar."],
      },
      {
        name: "Global Markets dashboard", href: "/#market-context", icon: "markets",
        body: "Objective market context: releases, positioning, yields and the dollar, kept next to the plan rather than in a feed.",
        points: ["Calendar with impact and plan notes.", "Weekly CFTC positioning.", "Markets tab: yields, curve, dollar."],
      },
    ],
    close: "The edge is not the setup. It is the process that keeps you taking it. Keep the process.",
  },
  {
    slug: "prop-firm",
    label: "Prop firm traders",
    headline: "Pass the evaluation. Keep the payout.",
    standfirst:
      "Funded trading turns risk into rules: daily loss limits, trailing drawdown, payout windows. The trades that blow an evaluation are rarely bad setups; they are good setups taken at the wrong size on the wrong day. TradingMC keeps the rules and the plan in the same place.",
    needs: ["Every account's drawdown and payout target visible before the first trade.", "Risk that is defined before entry and checked after.", "A plan that already knows which days to size down."],
    products: [
      {
        name: "All in one dashboard", href: "/#dashboard", icon: "dashboard",
        body: "Active capital across every evaluation and funded account, with drawdown used and the next payout target one tap away.",
        points: ["Two accounts or ten: one number for what is at risk.", "Drawdown and payout progress per account.", "Log the trade against the account it was taken in."],
      },
      {
        name: "My Edge", href: "/#the-approach", icon: "edge",
        body: "Rules written as commitments: respected risk, respected max trades, no revenge trade. Each session scores against them.",
        points: ["Discipline checks per trade feed the score.", "A goal like execution rate keeps sizing honest through a payout run.", "Habits that protect the account: pause after a loss."],
      },
      {
        name: "Global Markets dashboard", href: "/#market-context", icon: "markets",
        body: "The calendar tells you which sessions carry event risk, so the half-size day is planned, not improvised.",
        points: ["Rate decision on Wednesday: half size into the close.", "No entry before the print, written beside the event.", "Plan status: unchanged, and visible."],
      },
      {
        name: "MC Trade Therapist", href: "/#trade-therapist", icon: "therapist",
        body: "After a losing day inside a drawdown, the review asks the question that matters: what were you trying to recover, the setup or the feeling of being wrong?",
        points: ["Best trade of the day keeps the standard high on flat days.", "Weekly review before the next evaluation week.", "Monthly rollups across accounts."],
      },
    ],
    close: "The firm's rules are fixed. Your process is the variable. Make it the strong one.",
  },
];

export const TRADER_LEVEL_BY_SLUG: Record<string, TraderLevel> = Object.fromEntries(
  TRADER_LEVEL_PAGES.map((level) => [level.slug, level]),
);
