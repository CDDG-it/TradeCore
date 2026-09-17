// Marketing copy for the public feature pages.
// House style: plain language, trader-first, no em dashes, no filler.

export type FeatureBlock = {
  heading: string;
  body: string;
  points?: string[];
};

export type Feature = {
  slug: string;
  name: string;
  section: "Daily" | "Trading" | "Mindset" | "Markets";
  // One line used for feature-page metadata.
  tagline: string;
  // Short summary for reuse outside the landing page.
  blurb: string;
  // Optional action label for feature-specific links.
  cta: string;
  // Opening paragraph on the feature page.
  intro: string;
  blocks: FeatureBlock[];
};

export const FEATURES: Feature[] = [
  {
    slug: "dashboard",
    name: "Home",
    section: "Daily",
    tagline: "Your whole trading day on one screen.",
    blurb:
      "One view for your entire trading day. Habits, recent trades, funded account status and discipline score, all before the opening bell.",
    cta: "Open dashboard",
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
    name: "Accounts",
    section: "Trading",
    tagline: "Every account, payout and drawdown in one place.",
    blurb:
      "Track all funded prop firm accounts in one place. Monitor payouts, ROI multiples, drawdown thresholds and account phases.",
    cta: "View accounts",
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
  {
    slug: "habits",
    name: "Habits",
    section: "Daily",
    tagline: "The routine behind the results.",
    blurb:
      "Inside My Edge, track the daily habits that support your trading routine and review how consistently you complete them.",
    cta: "Track habits",
    intro:
      "Your edge is built long before the open. The Habits view inside My Edge makes your routine visible, so you can review the work you do away from the charts.",
    blocks: [
      {
        heading: "How it works",
        body: "Set the habits that matter and keep them honest, one day at a time.",
        points: [
          "Build daily, weekday or weekend habits and check them off from the overview or a full calendar you can backfill for any date.",
          "Watch completion rate, longest streak and an activity heatmap that shows consistency across weeks, not just today.",
          "Every habit only starts counting from the day you add it, so a fresh habit is never punished for history it was not part of.",
        ],
      },
      {
        heading: "Why it works",
        body: "Consistency is a curve, not a switch. By scoring how often you actually show up on every applicable day, Habits rewards the slow, repeated work that builds automaticity instead of a single burst of motivation that fades by Wednesday.",
      },
      {
        heading: "Why every trader needs this",
        body: "Sleep, preparation and review are what keep your decisions stable under pressure. Track them and they compound. Ignore them and they quietly decide your worst days for you.",
      },
    ],
  },
  {
    slug: "news-city",
    name: "Global Markets",
    section: "Markets",
    tagline: "Bring market context into the trading day.",
    blurb:
      "A market desk for futures, news, the economic calendar, cross-asset context and positioning, with source and timing visible.",
    cta: "Open Global Markets",
    intro:
      "Price does not move in a vacuum. Global Markets brings the wider context into one desk, so you can prepare for scheduled events and inspect the data behind a move.",
    blocks: [
      {
        heading: "How it works",
        body: "Move between a daily overview, markets, futures, news, the calendar and positioning in one place.",
        points: [
          "Check venue clocks and move between the overview, cross-asset markets and futures views.",
          "Read the news and calendar beside the data you use to prepare for a session.",
          "Each dataset shows its source and age, so delayed figures are not mistaken for a live quote.",
        ],
      },
      {
        heading: "Why it works",
        body: "Keeping the wider market close to your trading plan reduces the need to piece together context from separate tabs. It gives you a clearer starting point for your own read, without pretending to predict the next move.",
      },
      {
        heading: "Why every trader needs this",
        body: "A scheduled event or a change in related markets can alter the conditions you prepared for. Seeing the timing and source helps you decide when your setup still applies.",
      },
    ],
  },
  {
    slug: "psychological-edge",
    name: "My Edge",
    section: "Mindset",
    tagline: "Your rules, your habits, and one number for how ready you are.",
    blurb:
      "My Edge holds the two things you control away from the chart: the playbook you trade against, and the Mindscore that reads how well you are actually following it.",
    cta: "Open My Edge",
    intro:
      "Discipline is hard to see until it is already gone, and a strategy in your head changes shape under pressure. My Edge puts both in one place: the rules you decided on in the cold light of the weekend, and an honest read on whether you kept them.",
    blocks: [
      {
        heading: "Two halves, one page",
        body: "The side that defines what you do, and the side that measures whether you did it.",
        points: [
          "Strategy: write out the setups you trade with the exact conditions that qualify them, plus the risk rules that govern every position, so a valid trade is a checklist and not a gut call.",
          "Mind Edge: track the daily habits that build the state you trade from, and watch one Mindscore blend rule adherence, habits and kept commitments into a single read.",
          "Pressure-test the whole thing against a funded account's rules across thousands of simulated runs before you risk a live evaluation on it.",
        ],
      },
      {
        heading: "Why it works",
        body: "Rules and discipline are the same problem viewed from two ends. A written playbook removes the two most expensive words in trading, just this once. Scoring the process rather than the profit and loss then tells you, without flattery, whether you are still trading the plan you wrote. Neither half is much use alone.",
      },
      {
        heading: "Why every trader needs this",
        body: "The account is a lagging indicator. What you defined in advance and how faithfully you followed it are the leading ones. Keeping both on one page is what turns discipline from a word into something you can watch trend up.",
      },
    ],
  },
  {
    slug: "trade-therapist",
    name: "MC Trade Therapist",
    section: "Mindset",
    tagline: "Structured exercises built around your own trades.",
    blurb:
      "Review your trades, prepare for the next session and write commitments that return when the same pattern appears.",
    cta: "Open Trade Therapist",
    intro:
      "Generic mindset advice is easy to forget. MC Trade Therapist gives your own trades a place in the reflection, so the work begins with specific decisions rather than a motivational slogan.",
    blocks: [
      {
        heading: "How it works",
        body: "Move between best trades, pre-market exercises, commitments and reviews.",
        points: [
          "Review the best trade of a selected day and compare the decision with the result.",
          "Use recent wins and losses to prepare what you want to repeat or prevent before the next session.",
          "Write if/then commitments and check them when the guarded pattern appears again in later trades.",
        ],
      },
      {
        heading: "Why it works",
        body: "A concrete reflection is easier to act on than a broad intention. Revisiting a commitment when its trigger recurs gives you a way to examine whether your response changed.",
      },
      {
        heading: "Why every trader needs this",
        body: "Knowing a rule and following it under pressure are different skills. Structured review helps you practice that distinction from your own history.",
      },
    ],
  },
];

export const FEATURE_BY_SLUG: Record<string, Feature> = Object.fromEntries(
  FEATURES.map((f) => [f.slug, f]),
);
