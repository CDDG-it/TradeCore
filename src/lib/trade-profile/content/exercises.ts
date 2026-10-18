/**
 * Exercise library: three per focus area, one at each difficulty (1 easy, 2 medium,
 * 3 hard), so each phase of the program has its own step. Kept small on purpose.
 *
 * The 12-week program picks from here by relevance to the trader's goal:
 * exact trait + direction first, then the same domain, then the goal's focus
 * area, and general exercises (`trait: null`) as filler. See ../program.ts.
 *
 * Every exercise lists its references (content/references.ts). Each
 * reference carries its own verification status, which is shown in the app.
 */
import type { Exercise } from "@/lib/trade-profile/types";

export const exercises: Exercise[] = [
  // ── Calm under pressure (decrease Neuroticism) ───────────────────────────
  {
    id: "calm-name-it",
    title: "Name it to tame it",
    goal: "Notice and label stress as it rises, instead of acting on it.",
    target: { trait: "N", direction: "decrease" },
    focusArea: "calm",
    technique: "selfMonitoring",
    difficulty: 1,
    frequency: "Daily",
    duration: "2 minutes",
    instructions:
      "Three times today, pause and name what you feel in one word (tense, annoyed, flat, fine). Rate it from 0 to 10. There is no need to change it; noticing is the exercise.",
    tradingVersion:
      "Set a check-in at the open, mid-session and the close. Write the word and the number in your journal next to the time, and note whether a position was open.",
    logging: "Done = three ratings written down. Partly = one or two.",
    referenceIds: ["stieger2021", "lo2005"],
  },
  {
    id: "calm-cooldown-rule",
    title: "The cool-down rule",
    goal: "Stop frustration turning into a revenge trade.",
    target: { trait: "N2", direction: "decrease" },
    focusArea: "calm",
    technique: "implementationIntention",
    difficulty: 2,
    frequency: "Every trading day",
    duration: "10 minutes when triggered",
    instructions:
      "Decide on a cool-down action you can always do, such as standing up, a glass of water or a short walk. Plan: “If I feel the urge to get it back, then I do my cool-down first.”",
    tradingVersion:
      "“If I take a loss and feel the urge to re-enter right away, then I stand up and step away from the screen for 10 minutes before the next order.” Set a timer.",
    logging: "Done = every revenge urge got the cool-down. Partly = most did. No = I re-entered without it.",
    referenceIds: ["gollwitzer2006", "gross2002"],
  },
  {
    id: "calm-small-exposure",
    title: "Sit with the heat, in small steps",
    goal: "Build tolerance for normal adverse moves by staying with them on purpose.",
    target: { trait: "N1", direction: "decrease" },
    focusArea: "calm",
    technique: "gradedExposure",
    difficulty: 3,
    frequency: "3 times this week",
    duration: "Length of one trade",
    instructions:
      "Pick a situation that makes you mildly anxious and stay in it a little longer than feels comfortable, while noticing your breathing. Start small and go one step further next time.",
    tradingVersion:
      "On the simulator or at minimum size, take one planned trade and keep your hands off the mouse until the stop or target is hit. Rate your anxiety every few minutes. Increase size only once a step feels manageable.",
    logging: "Done = completed one step and wrote down the anxiety ratings. Partly = started but intervened early.",
    referenceIds: ["proto-graded-exposure", "lo2005"],
  },

  // ── Impulse control (increase Cautiousness) ──────────────────────────────
  {
    id: "impulse-ten-second",
    title: "Say the rule, count to ten",
    goal: "Put a fixed pause between the urge to enter and the order.",
    target: { trait: "C6", direction: "increase" },
    focusArea: "impulse",
    technique: "implementationIntention",
    difficulty: 1,
    frequency: "Every entry",
    duration: "10 seconds per trade",
    instructions: "Before acting on an urge today, say your plan out loud (“If ... then ...”) and count slowly to ten. Then decide.",
    tradingVersion:
      "Before every entry, say your entry rule out loud (“If price ... then I ...”) and wait 10 seconds with your hand off the mouse. Enter only if the rule is still met.",
    logging: "Done = every entry had the pause. Partly = most did.",
    referenceIds: ["gollwitzer2006"],
  },
  {
    id: "impulse-checklist-gate",
    title: "Checklist gate",
    goal: "Make every entry pass a written checklist first.",
    target: { trait: "C6", direction: "increase" },
    focusArea: "impulse",
    technique: "behaviouralActivation",
    difficulty: 2,
    frequency: "Every entry",
    duration: "30 seconds per trade",
    instructions:
      "Act as if you were a careful person: before a decision that matters today, run through three written questions and answer each one.",
    tradingVersion:
      "Write a 3-line entry checklist (setup, risk in R, invalidation level). Tick all three on paper before any order goes in. If a box cannot be ticked, there is no trade.",
    logging: "Done = every trade had a ticked checklist. Partly = most did.",
    referenceIds: ["hudson2019", "hudsonFraley2015"],
  },
  {
    id: "impulse-sim-only-hour",
    title: "The first hour belongs to the simulator",
    goal: "Practise patience in the riskiest part of the day.",
    target: { trait: "C6", direction: "increase" },
    focusArea: "impulse",
    technique: "gradedExposure",
    difficulty: 3,
    frequency: "3 days this week",
    duration: "First 30-60 minutes",
    instructions: "In a situation where you usually rush, wait a fixed time and only observe or practise.",
    tradingVersion:
      "For the first 30 minutes after the open, trade only on the simulator. Note how often you wanted to switch to live. Extend to 60 minutes once 30 feels easy.",
    logging: "Done = the full window was held. Partly = held for part of it.",
    referenceIds: ["proto-graded-exposure"],
  },

  // ── Follow-through (increase Conscientiousness) ──────────────────────────
  {
    id: "follow-two-minute-prep",
    title: "Two-minute pre-market",
    goal: "Make preparation so small that you always do it.",
    target: { trait: "C", direction: "increase" },
    focusArea: "followThrough",
    technique: "habitStacking",
    difficulty: 1,
    frequency: "Every trading day",
    duration: "2 minutes",
    instructions:
      "Attach one small task to something you already do every day, such as after the first coffee, and do it every day.",
    tradingVersion:
      "After you open the platform, write three things before anything else: today’s key level, today’s bias, and your max loss. Same place, same order, every day.",
    logging: "Done = all three were written before the first trade.",
    referenceIds: ["lally2010", "proto-habit-stacking"],
  },
  {
    id: "follow-review-every-trade",
    title: "No trade left unreviewed",
    goal: "Close the loop on every trade the same day.",
    target: { trait: "C5", direction: "increase" },
    focusArea: "followThrough",
    technique: "implementationIntention",
    difficulty: 2,
    frequency: "Every trading day",
    duration: "10-15 minutes",
    instructions: "Plan exactly when and where you will do a task you tend to skip: “If it is ..., then I ...”.",
    tradingVersion:
      "“If I close the platform, then I journal every trade from today before I leave the desk: setup, plan followed (yes/no), and one lesson.”",
    logging: "Done = every trade was journaled. Partly = some were.",
    referenceIds: ["gollwitzer2006"],
  },
  {
    id: "follow-full-routine-week",
    title: "Full routine, five days straight",
    goal: "Run your complete routine every day for a full week.",
    target: { trait: "C5", direction: "increase" },
    focusArea: "followThrough",
    technique: "behaviouralActivation",
    difficulty: 3,
    frequency: "Every trading day this week",
    duration: "Prep + session + review",
    instructions:
      "For one week, act as the most disciplined version of yourself: the complete routine, every day, with no exceptions planned.",
    tradingVersion:
      "Pre-market prep, the trade checklist on every entry, a hard stop time, and same-day journal review. All four, all five days.",
    logging: "Done = all four parts today. Partly = two or three parts.",
    referenceIds: ["hudson2019", "lally2010"],
  },

  // ── Thrill management (channel Excitement-Seeking) ───────────────────────
  {
    id: "thrill-boredom-log",
    title: "Boredom check",
    goal: "Learn to tell a setup from a craving for action.",
    target: { trait: "E5", direction: "channel" },
    focusArea: "thrill",
    technique: "selfMonitoring",
    difficulty: 1,
    frequency: "Every trade",
    duration: "5 seconds per trade",
    instructions: "Before you start something, ask whether you want to do it, or whether you simply want something to happen.",
    tradingVersion:
      "Before each entry, rate “How bored am I?” from 0 to 10 and write it in the journal. At the end of the week, compare your results at high and low boredom.",
    logging: "Done = every trade had a boredom rating.",
    referenceIds: ["stieger2021"],
  },
  {
    id: "thrill-quiet-market-rule",
    title: "Quiet market, quiet hands",
    goal: "Have a plan for slow markets that is not trading.",
    target: { trait: "E5", direction: "channel" },
    focusArea: "thrill",
    technique: "implementationIntention",
    difficulty: 2,
    frequency: "Every trading day",
    duration: "When the market is slow",
    instructions: "“If I feel restless with nothing to do, then I do my chosen alternative.” Choose the alternative in advance.",
    tradingVersion:
      "“If the market is range-bound and I feel the itch, then I open the replay tool and mark up yesterday’s chart for 15 minutes instead of entering.”",
    logging: "Done = every itch got the alternative. Partly = most did.",
    referenceIds: ["gollwitzer2006"],
  },
  {
    id: "thrill-size-ladder",
    title: "Earn the excitement",
    goal: "Tie extra risk to process, not to how you feel.",
    target: { trait: "E5", direction: "channel" },
    focusArea: "thrill",
    technique: "mentalContrasting",
    difficulty: 3,
    frequency: "Weekly",
    duration: "15 minutes",
    instructions: "Picture the outcome you want, then the inner obstacle that usually gets in the way, then a plan to beat it.",
    tradingVersion:
      "Wish: trade bigger. Outcome: picture what that would feel like. Obstacle: sizing up when bored or excited. Plan: “Size goes up only after 20 trades with 90% plan adherence, written down.”",
    logging: "Done = the plan was written and today’s sizing followed it.",
    referenceIds: ["oettingen2012"],
  },

  // ── Focused curiosity (increase Self-Discipline, keep Openness) ──────────
  {
    id: "curiosity-idea-parking",
    title: "Idea parking lot",
    goal: "Keep new ideas without acting on them mid-test.",
    target: { trait: "C5", direction: "increase" },
    focusArea: "curiosity",
    technique: "implementationIntention",
    difficulty: 1,
    frequency: "Daily",
    duration: "1 minute per idea",
    instructions: "“If I get an exciting new idea, then I write it in my parking-lot list and get back to the task.”",
    tradingVersion:
      "“If I see a new strategy, indicator or market I want to try, then I add it to the parking lot. I only look at that list on Sunday.”",
    logging: "Done = every new idea went into the list instead of onto the chart.",
    referenceIds: ["gollwitzer2006"],
  },
  {
    id: "curiosity-research-slot",
    title: "A home for curiosity",
    goal: "Give exploration a fixed, scheduled slot of its own.",
    target: { trait: "C5", direction: "increase" },
    focusArea: "curiosity",
    technique: "habitStacking",
    difficulty: 2,
    frequency: "Once a week",
    duration: "60 minutes",
    instructions: "Book one weekly slot just for exploring new ideas. Outside that slot, stick to the current project.",
    tradingVersion:
      "Every Sunday after the weekly review, spend one hour testing ideas from the parking lot, only in a backtest or on replay. Live trading stays on the current strategy.",
    logging: "Done = the slot happened, and the live strategy stayed unchanged.",
    referenceIds: ["lally2010", "proto-habit-stacking"],
  },
  {
    id: "curiosity-one-market-month",
    title: "One market, one setup",
    goal: "Go deep instead of wide for a whole block of time.",
    target: { trait: "C5", direction: "increase" },
    focusArea: "curiosity",
    technique: "behaviouralActivation",
    difficulty: 3,
    frequency: "Every trading day",
    duration: "This and the next 3 weeks",
    instructions: "Act as a specialist: choose one thing and do only that, every day, for several weeks.",
    tradingVersion: "Trade one instrument and one setup only, for four weeks. Any other chart stays closed during the session.",
    logging: "Done = only the chosen instrument and setup were traded today.",
    referenceIds: ["hudson2019"],
  },

  // ── Self-trust (increase Self-Efficacy) ──────────────────────────────────
  {
    id: "trust-evidence-file",
    title: "Evidence file",
    goal: "Build a written record that you can execute well.",
    target: { trait: "C1", direction: "increase" },
    focusArea: "selfTrust",
    technique: "reflection",
    difficulty: 1,
    frequency: "Daily",
    duration: "3 minutes",
    instructions: "Each day, write one thing you did competently, however small, and what it shows about you.",
    tradingVersion:
      "At the close, write one well-executed decision (an entry taken, a stop respected, a no-trade kept), whatever the P&L. Re-read the file before the open.",
    logging: "Done = one entry added today.",
    referenceIds: ["stieger2021"],
  },
  {
    id: "trust-if-valid-then-enter",
    title: "If valid, then enter",
    goal: "Take the decision away from doubt in the moment.",
    target: { trait: "C1", direction: "increase" },
    focusArea: "selfTrust",
    technique: "implementationIntention",
    difficulty: 2,
    frequency: "Every valid setup",
    duration: "Seconds per trade",
    instructions:
      "Write a rule that does the deciding: “If the criteria are met, then I act.” Then follow the rule rather than the feeling.",
    tradingVersion:
      "“If all three checklist items are met, then I enter within 10 seconds at planned size, and my stop goes where the plan says.”",
    logging: "Done = every valid setup was entered on time. Partly = some were.",
    referenceIds: ["gollwitzer2006"],
  },
  {
    id: "trust-share-a-trade",
    title: "Show your work",
    goal: "Become more comfortable being seen, including when you are wrong.",
    target: { trait: "N4", direction: "decrease" },
    focusArea: "selfTrust",
    technique: "gradedExposure",
    difficulty: 3,
    frequency: "Twice this week",
    duration: "15 minutes",
    instructions: "Share something you made with someone whose opinion you value. Start with a safe person and a small piece.",
    tradingVersion:
      "Post one trade, a loser included, with your reasoning to a trading buddy or community. Start with a winning trade if you need to; the goal is a losing trade by week’s end.",
    logging: "Done = shared one trade. Partly = drafted it but did not send it.",
    referenceIds: ["proto-graded-exposure"],
  },

  // ── Maintain and refine (general, any goal) ──────────────────────────────
  {
    id: "general-daily-intention",
    title: "Morning intention",
    goal: "Start every day with the goal in front of you.",
    target: { trait: null, direction: null },
    focusArea: "maintain",
    technique: "implementationIntention",
    difficulty: 1,
    frequency: "Daily",
    duration: "1 minute",
    instructions: "Re-read your if-then plan from the goal screen and picture one moment today when you will use it.",
    tradingVersion:
      "Before the open, read your if-then plan out loud and point to the time or level today where it is most likely to be needed.",
    logging: "Done = the plan was read and today’s moment was named.",
    referenceIds: ["gollwitzer2006", "oettingen2012"],
  },
  {
    id: "general-trigger-map",
    title: "Trigger map",
    goal: "Know in advance which situations test your goal.",
    target: { trait: null, direction: null },
    focusArea: "maintain",
    technique: "selfMonitoring",
    difficulty: 2,
    frequency: "This week",
    duration: "15 minutes",
    instructions:
      "List the five situations where you most often slip on your goal. For each one, write the first sign that it is coming.",
    tradingVersion:
      "Go through the last 20 journal entries. Mark when you broke a rule (time of day, after a win or loss, which news), and write an early-warning sign for each.",
    logging: "Done = the map was written with at least three triggers.",
    referenceIds: ["stieger2021"],
  },
  {
    id: "general-teach-it",
    title: "Teach it back",
    goal: "Strengthen a new way of acting by explaining it to someone else.",
    target: { trait: null, direction: null },
    focusArea: "maintain",
    technique: "behaviouralActivation",
    difficulty: 3,
    frequency: "Once this week",
    duration: "20 minutes",
    instructions:
      "Explain to someone what you are working on, what you have tried and what has helped, as if you were coaching them.",
    tradingVersion:
      "Walk a trading buddy through one week of journal entries, explaining how your goal shaped the decisions. Ask them what they noticed.",
    logging: "Done = the conversation took place.",
    referenceIds: ["hudson2019"],
  },
];

export const exerciseById = Object.fromEntries(exercises.map((e) => [e.id, e])) as Record<string, Exercise>;

/** Display names for techniques. */
export const techniqueNames: Record<Exercise["technique"], string> = {
  implementationIntention: "Implementation intention (if-then plan)",
  behaviouralActivation: "Behavioural activation (“act as if”)",
  selfMonitoring: "Self-monitoring",
  cognitiveReappraisal: "Cognitive reappraisal",
  mentalContrasting: "Mental contrasting (WOOP)",
  reflection: "Reflection",
  habitStacking: "Habit stacking",
  gradedExposure: "Exposure in small steps",
};
