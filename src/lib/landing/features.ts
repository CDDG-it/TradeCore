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
  section: "Daily" | "Trading" | "Mindset" | "Markets";
  // One line shown in the nav dropdown and as the page subtitle.
  tagline: string;
  // Short blurb reused on the homepage product preview.
  blurb: string;
  // Label for the orange button.
  cta: string;
  screenshot: string;
  // Native aspect ratio of the screenshot ("width / height"), so the frame
  // matches the real capture instead of forcing every shot into one crop.
  aspect: string;
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
    screenshot: "/screenshots/dashboard.png",
    aspect: "1676 / 714",
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
    screenshot: "/screenshots/journal.png",
    aspect: "1667 / 731",
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
    screenshot: "/screenshots/analysis.png",
    aspect: "848 / 956",
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
    screenshot: "/screenshots/analytics.png",
    aspect: "1666 / 906",
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
    screenshot: "/screenshots/accounts.png",
    aspect: "1659 / 769",
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
      "Track the daily habits that keep your trading sharp. Completion streaks, discipline trends and a calendar you can check off for any day.",
    cta: "Track habits",
    screenshot: "/screenshots/habits.png",
    aspect: "1144 / 626",
    intro:
      "Your edge is built long before the open. Habits tracks the routine that keeps you sharp, so the discipline you show away from the charts is the same discipline that shows up on them.",
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
    name: "Market Intelligence",
    section: "Trading",
    tagline: "See what is actually moving the market.",
    blurb:
      "A live map of the forces driving price. Central banks, macro data, commodities and earnings, scored by impact, direction and confidence.",
    cta: "Open the hub",
    screenshot: "/screenshots/market-intelligence.png",
    aspect: "1670 / 848",
    intro:
      "Price does not move in a vacuum. Market Intelligence turns the day's noise into a clear picture of what is driving risk right now, so you walk into the session knowing the context instead of reacting to it.",
    blocks: [
      {
        heading: "How it works",
        body: "The signals that move index futures, gathered into one readable view.",
        points: [
          "Explore an interactive 3D hub where central banks, macro data, commodities, earnings and index impact each feed the market core in real time.",
          "Click any node to drill into its signals — each scored by impact, direction and confidence, with what happened, why it matters and the historical context.",
          "Filter to the categories and impact levels you care about, so you see the events that actually matter for your instrument.",
        ],
      },
      {
        heading: "Why it works",
        body: "Most traders check five tabs and still miss the one number that mattered. Pulling the drivers into a single scored view means the context is already framed before the open, so you spend the session executing instead of scrambling to find out why price is moving.",
      },
      {
        heading: "Why every trader needs this",
        body: "The difference between a clean read and a blindside is usually knowing the regime you are trading in. A single view of risk and sentiment keeps you on the right side of the days that break the range.",
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
    screenshot: "/screenshots/psychological-edge.png",
    aspect: "1639 / 651",
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
    tagline: "A coach that talks back, built from your own trades.",
    blurb:
      "A deterministic coaching session that reads your real history. Every question traces to concrete numbers, never generic motivation, and every commitment comes back when it matters.",
    cta: "Open Trade Therapist",
    screenshot: "/screenshots/trade-therapist.png",
    aspect: "1670 / 848",
    intro:
      "Most trading advice is a poster on the wall. The MC Trade Therapist runs a real session on your own trades, so the conversation is about what you actually did, not what a generic mindset video thinks you should feel.",
    blocks: [
      {
        heading: "How it works",
        body: "A guided session that pulls its material straight from your history.",
        points: [
          "The therapist reads your journal, results and discipline data, then works through a structured 5R flow built around the patterns it finds.",
          "Every prompt is tied to concrete numbers from your trading, so you confront the trade you overheld or the rule you skipped, not a vague feeling.",
          "Commitments you make in a session are saved and surfaced again later, so the work carries into your next trades instead of ending when you close the tab.",
        ],
      },
      {
        heading: "Why it works",
        body: "Insight fades, patterns do not. Because the therapist is deterministic and data driven, it keeps pointing at the same expensive habit until you actually change it, which is exactly the accountability a motivational quote can never give you.",
      },
      {
        heading: "Why every trader needs this",
        body: "The gap between knowing a rule and keeping it is where accounts die. A session that ties every reflection to your real behavior, and holds you to what you committed to, is how that gap finally closes.",
      },
    ],
  },
];

export const FEATURE_BY_SLUG: Record<string, Feature> = Object.fromEntries(
  FEATURES.map((f) => [f.slug, f]),
);
