// Marketing copy for the public feature pages. Kept in one place so the landing
// nav, the product preview and the /features/[slug] pages all stay in sync.
// House style: plain language, trader-first, no em dashes, no filler.

export type FeatureBlock = {
  heading: string;
  body: string;
  points?: string[];
};

export type Feature = {
  slug: string;
  name: string;
  section: "Daily" | "Trading";
  // One line shown in the nav dropdown and as the page subtitle.
  tagline: string;
  // Short blurb reused on the homepage product preview.
  blurb: string;
  // Label for the orange button.
  cta: string;
  screenshot: string;
  // Opening paragraph on the feature page.
  intro: string;
  blocks: FeatureBlock[];
};

export const FEATURES: Feature[] = [
  {
    slug: "dashboard",
    name: "Dashboard",
    section: "Daily",
    tagline: "Your whole trading day on one screen.",
    blurb:
      "One view for your entire trading day. Habits, recent trades, funded account status and discipline score, all before the opening bell.",
    cta: "Open dashboard",
    screenshot: "/screenshots/dashboard.jpg",
    intro:
      "The dashboard is the first thing you open and the last thing you close. It pulls your entire trading day into a single view, so the parts that decide your results never hide in a separate tab.",
    blocks: [
      {
        heading: "How it works",
        body: "Everything that happened in a day lives in one connected calendar, with the running numbers stacked above it.",
        points: [
          "A month calendar marks each day with what actually happened: gold for a logged analysis, green for a win, red for a loss, amber for break even, blue when your habits were done.",
          "KPI cards surface your open accounts, recent results and discipline score without a single click.",
          "Click any day and the full story opens: pre market prep, habits, journal, mental state, recovery and every trade from that session, in order.",
        ],
      },
      {
        heading: "Why it works",
        body: "Most traders lose the thread between how they prepared and how they performed. The dashboard keeps cause and effect side by side, so a bad day is never just a red number. You see the prep that led into it and the state you were in when you pulled the trigger.",
      },
      {
        heading: "Why every trader needs this",
        body: "Funded traders are paid for consistency, not single trades. A daily command center makes consistency something you can see. When a week of green dots and completed habits sits in front of you, you protect the streak instead of gambling it away on a Friday afternoon.",
      },
    ],
  },
  {
    slug: "journal",
    name: "Journal",
    section: "Trading",
    tagline: "Every trade, logged with the context that explains it.",
    blurb:
      "Log every trade with setup, execution quality and session context. Review your full trade history in list or calendar view.",
    cta: "View journal",
    screenshot: "/screenshots/journal.jpg",
    intro:
      "A trade you do not write down is a trade you will take again without knowing why. The journal turns every fill into a record you can actually learn from.",
    blocks: [
      {
        heading: "How it works",
        body: "Logging a trade takes seconds and captures more than the numbers.",
        points: [
          "Record the setup, the session, your execution quality and the context around each trade, and paste a chart screenshot straight from your clipboard.",
          "Mark execution as good or bad independently of the result, because a winning trade taken badly is still a problem.",
          "Review your full history in a clean list or a calendar that shows results and execution quality at a glance.",
        ],
      },
      {
        heading: "Why it works",
        body: "Separating result from execution is the whole game. Profit hides bad habits and losses hide good decisions. By scoring how you traded and not only what you made, the journal surfaces the behavior that compounds over months instead of the variance that swings day to day.",
      },
      {
        heading: "Why every trader needs this",
        body: "Every prop firm wants to see process, not luck. A complete journal is the line between a trader who caught a good run and a trader who can repeat results. When drawdown hits, your journal is the evidence that tells you whether to push on or step back.",
      },
    ],
  },
  {
    slug: "analysis",
    name: "Analysis",
    section: "Trading",
    tagline: "Walk into the session with a plan, not a guess.",
    blurb:
      "Build structured pre market analysis around bias, key levels and session scenarios before you ever touch the keyboard.",
    cta: "Review analyses",
    screenshot: "/screenshots/analysis.jpg",
    intro:
      "The session is won before the open. Analysis is where you decide what you are looking for, so you are not improvising once the candles start moving.",
    blocks: [
      {
        heading: "How it works",
        body: "A pre market note gives the session a shape before the first tick.",
        points: [
          "Build a structured note around your bias, the key levels you care about and the scenarios you expect.",
          "Attach charts and mark the levels that matter, so your plan is visual and not just a wall of text.",
          "Pull up past analyses in a calendar colored by bias, so you can see how often your read was actually right.",
        ],
      },
      {
        heading: "Why it works",
        body: "A written plan removes the two most expensive emotions in trading: hesitation and impulse. When you have already decided what a valid setup looks like, you act without second guessing, and you pass on the trades that were never part of the plan.",
      },
      {
        heading: "Why every trader needs this",
        body: "Discretionary traders blow accounts on trades they never intended to take. Pre market analysis draws a clear line between a setup and a temptation. Do it daily and your decisions during the session turn into a checklist instead of a coin flip.",
      },
    ],
  },
  {
    slug: "analytics",
    name: "Analytics",
    section: "Trading",
    tagline: "Stop guessing what works. See it.",
    blurb:
      "Find patterns in your execution over time. Win rate by session, R multiples, day of week tendencies and discipline trends.",
    cta: "See analytics",
    screenshot: "/screenshots/analytics.jpg",
    intro:
      "Your edge is hiding in your own data. Analytics finds it. No spreadsheets and no manual tallies, just the patterns in how you actually trade.",
    blocks: [
      {
        heading: "How it works",
        body: "Your trade history is turned into the breakdowns that matter, automatically.",
        points: [
          "See win rate by session, day of week and setup, so you know when you perform and when you should sit on your hands.",
          "Track R multiples and your result breakdown over time instead of fixating on single trades.",
          "Watch a dedicated execution breakdown that scores discipline separately from profit and loss.",
        ],
      },
      {
        heading: "Why it works",
        body: "Gut feeling lies. You remember the big winners and forget the slow bleed of trades you should never have taken. Analytics replaces memory with numbers, and the numbers usually point straight at the one or two habits quietly costing you the most.",
      },
      {
        heading: "Why every trader needs this",
        body: "You cannot fix what you cannot measure. The traders who survive funded accounts are the ones who cut their worst patterns and lean into their best. Analytics tells you which is which in days instead of years.",
      },
    ],
  },
  {
    slug: "accounts",
    name: "Funded Accounts",
    section: "Trading",
    tagline: "Every account, payout and drawdown in one place.",
    blurb:
      "Track all funded prop firm accounts in one place. Monitor payouts, ROI multiples, drawdown thresholds and account phases.",
    cta: "View accounts",
    screenshot: "/screenshots/accounts.jpg",
    intro:
      "Trading one funded account is simple. Trading five across three firms turns into a spreadsheet nightmare. Accounts keeps all of it in one place.",
    blocks: [
      {
        heading: "How it works",
        body: "Each account carries its own size, phase, risk and return, all visible at once.",
        points: [
          "Track every prop firm account with its size, phase and status, and move a new account from evaluation to funded with a single click.",
          "Monitor payouts, ROI multiples and drawdown thresholds per account, so you always know how much room you have left.",
          "See at a glance which accounts are active, which are still in evaluation and what each one has returned on its cost.",
        ],
      },
      {
        heading: "Why it works",
        body: "Drawdown is the one rule that ends careers. Keeping every threshold visible means you never wander into a breach because you lost track of which account you were in. The ROI multiple turns a hidden cost into a clear number you can manage.",
      },
      {
        heading: "Why every trader needs this",
        body: "Scaling means more accounts, and more accounts means more ways to make an expensive mistake. A single source of truth for payouts and risk is what lets you grow the number of accounts without growing the chaos.",
      },
    ],
  },
];

export const FEATURE_BY_SLUG: Record<string, Feature> = Object.fromEntries(
  FEATURES.map((f) => [f.slug, f]),
);
