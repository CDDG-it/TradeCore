/**
 * What the Today section offers each trader type: short reads, facts and
 * in-the-moment drills, plus the search the live news is drawn from.
 *
 * Every read, fact and drill links to entries in references.ts, so the reader
 * can see whether a statement rests on a checked paper, a paper not yet
 * checked, or a prototype assumption. Facts only state what the linked
 * reference's `claim` says. The drills are deliberately different from the
 * 12-week program's challenges (exercises.ts) and the Pre-market exercises:
 * they are for the moment itself, seconds to minutes long.
 *
 * Copy rules (BRAND.md): no em or en dashes, no ellipsis characters.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";

export interface Read {
  id: string;
  title: string;
  minutes: number;
  paragraphs: string[];
  refs: string[];
}

export interface Fact {
  text: string;
  ref: string;
}

/** One phase of a guided breath: how long, and how far the guide circle grows (0..1). */
export interface BreathPhase {
  label: string;
  seconds: number;
  size: number;
}

export interface Drill {
  id: string;
  title: string;
  duration: string;
  /** The moment it is for. */
  when: string;
  steps: string[];
  why: string;
  refs: string[];
  /** Present for breathing drills: the drill can be followed with a guide. */
  breath?: { phases: BreathPhase[]; rounds: number };
}

export interface TypeInsights {
  reads: Read[];
  facts: Fact[];
  drills: Drill[];
  /** Marketaux search for this type's theme: quoted phrases joined with "|" (OR). Bare words match company names. */
  newsQuery: string;
}

const SIGH: Drill = {
  id: "drill-cyclic-sigh",
  title: "The double sigh",
  duration: "1 minute",
  when: "Right after a fast move against you",
  steps: [
    "Breathe in through your nose, then top it up with a second short breath in.",
    "Let it all out slowly through your mouth, longer than the breath in.",
    "Five rounds. Only then look at the chart again.",
  ],
  why: "A short, structured breath gives the body something to do before the hand does something to the position.",
  refs: ["balban2023", "lo2002"],
  breath: {
    phases: [
      { label: "Breathe in", seconds: 2, size: 0.78 },
      { label: "Top it up", seconds: 1, size: 1 },
      { label: "Long breath out", seconds: 6, size: 0.3 },
    ],
    rounds: 5,
  },
};

const SLOW: Drill = {
  id: "drill-six-breaths",
  title: "Six breaths a minute",
  duration: "2 minutes",
  when: "Before the open, or when your pulse is up",
  steps: [
    "Breathe in for five seconds, out for five.",
    "Keep the shoulders down; let the belly move.",
    "Twelve breaths, then write one word for how you feel.",
  ],
  why: "Slow breathing is one of the most studied ways to settle the body's stress response.",
  refs: ["zaccaro2018"],
  breath: {
    phases: [
      { label: "Breathe in", seconds: 5, size: 1 },
      { label: "Breathe out", seconds: 5, size: 0.3 },
    ],
    rounds: 12,
  },
};

const LABEL: Drill = {
  id: "drill-label-mood",
  title: "One word at the open",
  duration: "15 seconds",
  when: "As the session starts",
  steps: [
    "Before the first trade, write one word for your mood in the journal.",
    "No explaining, no fixing: just the word.",
    "At the close, check whether trades taken in that mood looked different.",
  ],
  why: "Naming a feeling dampens the brain's alarm response to it, and the log shows which moods cost you.",
  refs: ["lieberman2007"],
};

const FRESH: Drill = {
  id: "drill-fresh-start",
  title: "Fresh start reset",
  duration: "5 minutes",
  when: "Monday morning, or the first day of a month",
  steps: [
    "Write the one rule you broke most last period.",
    "Write how this period is different: one change in where, when or how much you trade.",
    "Put it where you see it before the first trade.",
  ],
  why: "People take on goals more readily right after a new week or month starts, so that is the moment to reset a rule.",
  refs: ["dai2014"],
};

export const insights: Record<FocusAreaId, TypeInsights> = {
  calm: {
    reads: [
      {
        id: "read-body-first",
        title: "Your body reacts before you decide",
        minutes: 2,
        paragraphs: [
          "Even experienced traders react physically to the market. Measured during live sessions, professionals showed clear changes in skin conductance and heart activity around market events and in volatile periods.",
          "That reaction is not the problem. The problem is when it makes the decision: a panic exit, a stop moved, a revenge entry. The earlier you notice the body, the more room there is between the reaction and the click.",
          "Practical version: decide in advance what you do when you notice your pulse, and make it physical. A breath, hands off the mouse, a word in the journal.",
        ],
        refs: ["lo2002", "lo2005"],
      },
      {
        id: "read-before-not-after",
        title: "Regulate before, not after",
        minutes: 2,
        paragraphs: [
          "A study of traders at four London banks found that those who managed their emotions before they took hold did better than those who mainly tried to suppress them afterwards.",
          "Reframing a situation changes how strongly an emotion is felt; suppressing its outward signs does not. For a trader that means preparing the meaning of a loss before the loss: \"a stopped trade is a cost of doing business\".",
          "Write that sentence before the session, not after the third red trade.",
        ],
        refs: ["fenton2011", "gross2002"],
      },
    ],
    facts: [
      { text: "In 80 day-traders, those whose emotional reactions to gains and losses were more intense performed significantly worse.", ref: "lo2005" },
      { text: "On a London trading floor, traders' cortisol rose with the variance of their own results and with market volatility.", ref: "coates2008" },
      { text: "Putting a feeling into words reduced the amygdala's response to negative images in an fMRI study.", ref: "lieberman2007" },
    ],
    drills: [SIGH, SLOW, LABEL],
    newsQuery: '"trading psychology" | "trader anxiety" | "panic selling" | "fear of losing"',
  },
  impulse: {
    reads: [
      {
        id: "read-urge-wave",
        title: "An urge is a wave, not an order",
        minutes: 2,
        paragraphs: [
          "The urge to enter usually peaks fast and fades if you do nothing with it. Urge surfing, a technique from addiction research, uses exactly that: notice the urge, rate it, and watch it rise and fall without acting.",
          "The goal is not to never feel the urge. It is to put a few seconds between the urge and the click, so the plan gets a vote.",
          "Practise it on small urges first: refreshing the P&L, checking a second chart. Then use it on the entry you did not plan.",
        ],
        refs: ["bowen2009", "proto-friction"],
      },
      {
        id: "read-cost-of-clicks",
        title: "What every extra trade costs",
        minutes: 2,
        paragraphs: [
          "In a large study of household brokerage accounts, the households that traded the most earned 11.4% a year while the market returned 17.9%. The authors point to overconfidence as an explanation for the high trading.",
          "Your trades are not their trades, but the direction is worth taking seriously: more trades means more costs and more decisions made under pressure.",
          "Count your unplanned clicks for a week. The number is the first thing to bring down.",
        ],
        refs: ["barber2000"],
      },
    ],
    facts: [
      { text: "Households that traded the most earned 11.4% a year, against 17.9% for the market (1991 to 1996).", ref: "barber2000" },
      { text: "Investors prone to sensation seeking and overconfidence traded more frequently, even after controlling for wealth, income and age.", ref: "grinblatt2009" },
      { text: "Specific \"if this, then that\" plans help people act on their goals.", ref: "gollwitzer2006" },
    ],
    drills: [
      {
        id: "drill-surf-urge",
        title: "Surf the urge",
        duration: "90 seconds",
        when: "When you want to enter a trade you did not plan",
        steps: [
          "Hands off the mouse. Rate the urge from 1 to 10.",
          "Watch where you feel it and how it changes, without acting on it.",
          "Rate it again after 90 seconds. Only a planned setup gets an entry.",
        ],
        why: "Urges peak and fade; acting on the peak is what costs money.",
        refs: ["bowen2009"],
      },
      {
        id: "drill-risk-in-money",
        title: "Write the loss first",
        duration: "30 seconds",
        when: "Before every entry",
        steps: [
          "Write the stop as an amount of money, not ticks.",
          "Say it once: \"If this hits, I lose this much.\"",
          "If you would not accept that loss, there is no trade.",
        ],
        why: "A small, deliberate step between the urge and the click makes impulsive entries less likely.",
        refs: ["proto-friction"],
      },
      FRESH,
    ],
    newsQuery: '"revenge trading" | "overtrading" | "impulsive trading" | "trading psychology"',
  },
  followThrough: {
    reads: [
      {
        id: "read-landmarks",
        title: "Use the calendar's fresh starts",
        minutes: 2,
        paragraphs: [
          "Gym visits and goal commitments rise right after a new week, month or year begins. Researchers call it the fresh start effect: a landmark puts past slips in a previous period.",
          "For a trader whose plan drifts, that is a tool. Instead of waiting for motivation, reset the one rule that slipped on Monday morning or the first of the month.",
          "Keep the reset small: one rule, written down, visible before the first trade.",
        ],
        refs: ["dai2014"],
      },
      {
        id: "read-holding-losers",
        title: "Why the plan breaks on the losers",
        minutes: 2,
        paragraphs: [
          "Across 10,000 brokerage accounts, investors strongly preferred selling winners over losers, and the losers they held did not make up for it later. It is called the disposition effect.",
          "A plan is easy to follow when a trade works. It is tested when a trade goes against you and closing it means admitting the loss.",
          "Decide the exit before the entry, and review every loser for one question only: did I exit where I said I would?",
        ],
        refs: ["odean1998", "shefrin1985"],
      },
    ],
    facts: [
      { text: "Investors in 10,000 accounts showed a strong preference for realising winners rather than losers, and it was not justified by later performance.", ref: "odean1998" },
      { text: "Goal-directed behaviour increased after temporal landmarks such as the start of a new week or month.", ref: "dai2014" },
      { text: "Repeating a behaviour in the same context is what makes it automatic over time.", ref: "lally2010" },
    ],
    drills: [
      FRESH,
      {
        id: "drill-three-lines",
        title: "Three lines at the close",
        duration: "2 minutes",
        when: "Right after your last trade of the day",
        steps: [
          "Line one: what the plan said.",
          "Line two: what you did.",
          "Line three: the gap, in one sentence. No gap? Write that too.",
        ],
        why: "Seeing the gap every day, while it is small, keeps the plan and the trading from drifting apart.",
        refs: ["proto-habit-stacking"],
      },
      LABEL,
    ],
    newsQuery: '"trading discipline" | "trading plan" | "trading psychology"',
  },
  thrill: {
    reads: [
      {
        id: "read-entertainment",
        title: "When trading is the entertainment",
        minutes: 2,
        paragraphs: [
          "Among 1,000 brokerage clients, those who said they enjoy investing or gambling turned their portfolio over at twice the rate of their peers. The researchers' conclusion: part of trading is done for the experience, not the return.",
          "If you trade for the rush, a quiet market feels like a problem to solve. The setups that appear then are often the ones you invented.",
          "Give the need for excitement a home outside the session, and let the session be boring on purpose.",
        ],
        refs: ["dorn2009", "grinblatt2009"],
      },
      {
        id: "read-boring-wins",
        title: "Boring is a feature",
        minutes: 2,
        paragraphs: [
          "Sensation seeking is linked with trading more often, even after controlling for wealth and income. More trading is not more edge.",
          "A good session can look like waiting, one trade, and a closed platform. That can feel like nothing happened. It is exactly what a plan looks like when it works.",
          "Measure the session by how closely you followed the plan, not by how much happened.",
        ],
        refs: ["grinblatt2009", "barber2000"],
      },
    ],
    facts: [
      { text: "Clients who enjoy investing or gambling turned over their portfolio at twice the rate of their peers.", ref: "dorn2009" },
      { text: "Investors most prone to sensation seeking traded more frequently.", ref: "grinblatt2009" },
      { text: "The households that traded the most earned 11.4% a year, against 17.9% for the market.", ref: "barber2000" },
    ],
    drills: [
      {
        id: "drill-count-clicks",
        title: "Count the clicks",
        duration: "All session",
        when: "During a quiet market",
        steps: [
          "Keep a paper tally next to the screen.",
          "One stroke for every order you did not plan before the session.",
          "At the close, write the number in your journal. Aim for a lower number next week.",
        ],
        why: "What is counted tends to come down, and unplanned trades are the ones that cost most.",
        refs: ["barber2000"],
      },
      {
        id: "drill-excitement-elsewhere",
        title: "Excitement before the open",
        duration: "20 minutes",
        when: "Before a session you expect to be slow",
        steps: [
          "Schedule something with real intensity before the session: a run, a hard workout, a game.",
          "Go into the session already satisfied.",
          "Note afterwards whether you traded less than on other slow days.",
        ],
        why: "If part of the urge to trade is the experience itself, it helps to get that experience somewhere it costs nothing.",
        refs: ["dorn2009"],
      },
      {
        id: "drill-hide-pnl",
        title: "Hide the P&L",
        duration: "One session",
        when: "A day you notice you are chasing",
        steps: [
          "Hide the running P&L on your platform for one session.",
          "Judge each trade on the setup, not the money.",
          "Check the result only after the close.",
        ],
        why: "A moving P&L turns every tick into a game; hiding it takes the scoreboard away from the session.",
        refs: ["proto-friction"],
      },
    ],
    newsQuery: '"overtrading" | "trading addiction" | "fear of missing out" | "day trading"',
  },
  curiosity: {
    reads: [
      {
        id: "read-sample-size",
        title: "Ten trades say almost nothing",
        minutes: 2,
        paragraphs: [
          "A setup with a real edge still has losing streaks. Judge it on ten trades and you will throw away good setups exactly when they are in a normal dip.",
          "Curiosity is an asset: it finds new ideas. It turns into a cost when every losing streak becomes a reason to switch.",
          "Pick a number before you start, for example thirty trades, and do not change the setup until you reach it.",
        ],
        refs: ["proto-sample-size"],
      },
      {
        id: "read-one-change",
        title: "Change one thing at a time",
        minutes: 2,
        paragraphs: [
          "When you change the timeframe, the entry and the market in the same week, you cannot tell which change helped or hurt.",
          "Keep a short change log: date, the one thing you changed, and why. Then give it enough trades to judge.",
          "New ideas go to the simulator or a parking list first, not into today's plan.",
        ],
        refs: ["proto-sample-size", "proto-graded-exposure"],
      },
    ],
    facts: [
      { text: "Overconfident investors and those prone to sensation seeking traded more frequently.", ref: "grinblatt2009" },
      { text: "Behaviour repeated in a stable context becomes more automatic over time, which is how a setup becomes routine.", ref: "lally2010" },
      { text: "The links between facet patterns and trading problems in this program are design assumptions to test, not research findings.", ref: "proto-trading-links" },
    ],
    drills: [
      {
        id: "drill-thirty-trades",
        title: "The thirty-trade counter",
        duration: "10 seconds per trade",
        when: "Every time you take your main setup",
        steps: [
          "Write the setup name and a tally at the top of your journal.",
          "Add one stroke per trade taken on it.",
          "No changes to the setup before thirty strokes.",
        ],
        why: "Fixing the number in advance protects a setup from being dropped in a normal losing streak.",
        refs: ["proto-sample-size"],
      },
      {
        id: "drill-change-log",
        title: "One-line change log",
        duration: "1 minute",
        when: "Whenever you want to change something in your approach",
        steps: [
          "Write the date and the one thing you want to change.",
          "Write why, in one sentence.",
          "If something else changed this week already, park this one.",
        ],
        why: "Changing one thing at a time is the only way to learn which change mattered.",
        refs: ["proto-sample-size"],
      },
      FRESH,
    ],
    newsQuery: '"trading strategy" | "backtesting" | "trading discipline"',
  },
  selfTrust: {
    reads: [
      {
        id: "read-name-yourself",
        title: "Talk to yourself like a coach",
        minutes: 2,
        paragraphs: [
          "Research on self-talk suggests that how you talk to yourself matters: using your own name or \"you\" instead of \"I\" creates distance, and distance helps under stress.",
          "Second-guessing usually sounds like \"what if I'm wrong\". A coach would say: \"Sam, the setup is there, the risk is set, take it.\"",
          "Write that sentence for your main setup and say it when the hesitation comes.",
        ],
        refs: ["kross2014"],
      },
      {
        id: "read-evidence",
        title: "Confidence is built from evidence",
        minutes: 2,
        paragraphs: [
          "Belief in your own ability grows most from your own experiences of doing the thing. Not from motivation, and not from waiting until you feel ready.",
          "For a hesitant trader that means taking the valid setup at a size where being wrong does not hurt, and collecting the evidence that you can execute.",
          "Size comes back when the evidence is there, not before.",
        ],
        refs: ["bandura1977", "proto-graded-exposure"],
      },
    ],
    facts: [
      { text: "Reappraising pre-performance anxiety as excitement, instead of trying to calm down, was tested as a way to perform better under pressure.", ref: "brooks2014" },
      { text: "Self-efficacy, the belief that you can carry out a behaviour, is built most strongly by your own experiences of doing it.", ref: "bandura1977" },
      { text: "Even professional traders showed measurable physiological reactions to market events during live trading.", ref: "lo2002" },
    ],
    drills: [
      {
        id: "drill-own-name",
        title: "Say it with your name",
        duration: "10 seconds",
        when: "When a valid setup appears and you hesitate",
        steps: [
          "Say it with your own name: \"Name, the setup is valid.\"",
          "\"Name, the risk is set.\"",
          "\"Take it.\" Then act on the plan.",
        ],
        why: "Speaking to yourself in the second or third person creates distance from the doubt.",
        refs: ["kross2014"],
      },
      {
        id: "drill-call-it-excitement",
        title: "Call it excitement",
        duration: "30 seconds",
        when: "Before the open, when you feel nervous",
        steps: [
          "Notice the nerves. Do not try to calm down.",
          "Say out loud: \"I am excited.\"",
          "Use the energy to run your checklist one more time.",
        ],
        why: "Relabelling nerves as excitement keeps the energy and changes what it is pointed at.",
        refs: ["brooks2014"],
      },
      SIGH,
    ],
    newsQuery: '"trading psychology" | "trader confidence" | "self-doubt"',
  },
  maintain: {
    reads: [
      {
        id: "read-sleep-size",
        title: "Sleep before size",
        minutes: 2,
        paragraphs: [
          "After about two nights without sleep, healthy volunteers made riskier and worse choices on a decision task than when rested.",
          "A short night is not two nights awake, but the direction is the same: tired brains take more risk and notice it less.",
          "A simple rule protects a solid baseline: below your sleep minimum, half size and no trades in the first fifteen minutes.",
        ],
        refs: ["killgore2006"],
      },
      {
        id: "read-no-trader-personality",
        title: "There is no single trader personality",
        minutes: 2,
        paragraphs: [
          "In a study of 80 day-traders, personality scores did not reveal one specific trader profile. What did matter was how intense their emotional reactions to gains and losses were.",
          "A balanced profile is a good starting point, not a guarantee. Busy periods and drawdowns test everyone.",
          "Keep the routines that work, and watch how you react to losses: that is where a stable baseline usually cracks first.",
        ],
        refs: ["lo2005"],
      },
    ],
    facts: [
      { text: "Personality inventory scores of 80 day-traders did not reveal a specific trader personality profile.", ref: "lo2005" },
      { text: "After about 49 hours without sleep, people made riskier choices on the Iowa Gambling Task.", ref: "killgore2006" },
      { text: "Traders who regulated emotions before they took hold had a performance advantage over those relying on suppression.", ref: "fenton2011" },
    ],
    drills: [
      {
        id: "drill-sleep-rule",
        title: "Sleep check before size",
        duration: "10 seconds",
        when: "Every morning before the session",
        steps: [
          "Write how many hours you slept.",
          "Below your minimum: half size, no trades in the first fifteen minutes.",
          "Note it in the journal so you can see the effect over a month.",
        ],
        why: "Tired decisions are riskier decisions, and they rarely feel that way at the time.",
        refs: ["killgore2006"],
      },
      LABEL,
      FRESH,
    ],
    newsQuery: '"trading psychology" | "behavioral finance"',
  },
};
