/**
 * Plain-language explanations of the 5 domains and 30 facets.
 *
 * Domain and facet NAMES follow the IPIP NEO facet scales (ipip.ori.org). The explanations
 * and "for trading" lines are written for this prototype: they describe
 * tendencies, never verdicts, and are prototype hypotheses rather than findings
 * (see references.ts → proto-trading-links).
 */
import type { DomainCode, FacetCode } from "@/lib/trade-profile/types";

export interface TraitText {
  name: string;
  /** What the trait describes, in one or two sentences. */
  about: string;
  /** What scoring towards the low end tends to look like. */
  low: string;
  /** What scoring towards the high end tends to look like. */
  high: string;
  /** How it can show up at the screen. Tendencies, not verdicts. */
  trading: string;
}

export const domains: Record<DomainCode, TraitText> = {
  N: {
    name: "Neuroticism",
    about: "How strongly and how often you feel negative emotions such as worry, frustration and stress.",
    low: "Tends to stay even-keeled; setbacks register but pass quickly.",
    high: "Tends to feel stress and worry more intensely and for longer.",
    trading:
      "Higher scores can make drawdowns, losing streaks and open risk feel heavier, which may pull toward early exits or revenge trades. Lower scores can make it easier to sit through normal variance, but can also mute useful warning signals.",
  },
  E: {
    name: "Extraversion",
    about: "How much energy you draw from people, activity and stimulation.",
    low: "Tends to prefer quiet, a steady pace and fewer people.",
    high: "Tends to seek company, activity and excitement.",
    trading:
      "Higher scores may bring energy and decisiveness, and also a pull toward action when the market is slow. Lower scores may suit patient, solitary work, while making it easier to skip sharing results with a mentor or community.",
  },
  O: {
    name: "Openness to Experience",
    about: "How drawn you are to ideas, imagination, novelty and new ways of doing things.",
    low: "Tends to prefer the familiar, concrete and proven.",
    high: "Tends to enjoy new ideas, variety and abstract thinking.",
    trading:
      "Higher scores can fuel research and creative strategy work, and can also make it tempting to switch systems before a fair sample is in. Lower scores can support sticking to a proven playbook, with less appetite for adapting when conditions change.",
  },
  A: {
    name: "Agreeableness",
    about: "How much you lean toward trust, cooperation and concern for others.",
    low: "Tends to be sceptical, direct and competitive.",
    high: "Tends to be trusting, accommodating and warm.",
    trading:
      "Higher scores may make it easier to accept feedback, and also to follow other people’s calls without checking them. Lower scores may help you question the crowd, and can make it harder to take advice from a mentor.",
  },
  C: {
    name: "Conscientiousness",
    about: "How organised, reliable, goal-directed and careful you tend to be.",
    low: "Tends to be flexible and spontaneous, and can find routines hard to keep.",
    high: "Tends to plan, follow through and think before acting.",
    trading:
      "Higher scores tend to support following a plan, keeping a journal and reviewing trades. Lower scores can make routines, risk rules and reviews slip, especially when the session gets busy.",
  },
};

export const facets: Record<FacetCode, TraitText> = {
  N1: {
    name: "Anxiety",
    about: "How readily you worry and feel tense about what might go wrong.",
    low: "Rarely preoccupied with what could go wrong.",
    high: "Often anticipates problems and feels tense about them.",
    trading: "Can show up as hesitating on valid setups, or exiting at the first tick against you.",
  },
  N2: {
    name: "Anger",
    about: "How quickly you feel irritated or angry when things do not go your way.",
    low: "Slow to irritation; frustrations tend to pass.",
    high: "Frustration can rise quickly and strongly.",
    trading: "Can show up as “getting it back” after a loss: revenge trades or doubling up.",
  },
  N3: {
    name: "Depression",
    about: "How often you feel down, discouraged or low in energy. This is a personality facet, not a diagnosis.",
    low: "Tends to keep a hopeful outlook after setbacks.",
    high: "Setbacks can weigh on mood and motivation for a while.",
    trading: "Can show up as losing motivation to review or trade after a red week.",
  },
  N4: {
    name: "Self-Consciousness",
    about: "How sensitive you are to what others think, and how easily you feel awkward or exposed.",
    low: "Comfortable being seen, wrong or judged.",
    high: "Can feel exposed by mistakes or by other people’s opinions.",
    trading: "Can show up as fear of being wrong: second-guessing entries, or not sharing trades for review.",
  },
  N5: {
    name: "Immoderation",
    about: "How hard you find it to resist cravings and urges in the moment.",
    low: "Urges are easy to set aside.",
    high: "In-the-moment urges can be hard to resist.",
    trading: "Can show up as unplanned entries, chasing moves, or one more trade after the session should end.",
  },
  N6: {
    name: "Vulnerability",
    about: "How much pressure and emergencies throw you off balance.",
    low: "Stays composed under pressure.",
    high: "Under pressure, can feel overwhelmed and find it hard to decide.",
    trading: "Can show up as freezing or panicking when a position moves fast.",
  },
  E1: {
    name: "Friendliness",
    about: "How warm and open you are toward other people.",
    low: "Reserved; warms up slowly.",
    high: "Warm and approachable.",
    trading: "Can make it easier to build a network of traders to learn from and review with.",
  },
  E2: {
    name: "Gregariousness",
    about: "How much you enjoy being around groups of people.",
    low: "Prefers to work alone or in small groups.",
    high: "Enjoys crowds and busy settings.",
    trading: "Can make trading rooms and communities energising; a low score can make solo trading feel natural.",
  },
  E3: {
    name: "Assertiveness",
    about: "How readily you take charge and speak up.",
    low: "Prefers to let others lead.",
    high: "Takes charge and states views firmly.",
    trading: "Can support decisive execution; at the extreme, can make it harder to admit a trade is wrong.",
  },
  E4: {
    name: "Activity Level",
    about: "How fast-paced and busy you like your life to be.",
    low: "Prefers a relaxed, unhurried pace.",
    high: "Likes to keep busy and move fast.",
    trading: "A high score can make waiting for setups feel uncomfortable.",
  },
  E5: {
    name: "Excitement-Seeking",
    about: "How much you seek thrills, stimulation and risk for its own sake.",
    low: "Prefers calm and predictability.",
    high: "Drawn to excitement, intensity and risk.",
    trading: "Can show up as overtrading, trading out of boredom, or sizing up for the rush.",
  },
  E6: {
    name: "Cheerfulness",
    about: "How often you feel joy, enthusiasm and positive energy.",
    low: "Tends to be more serious and subdued.",
    high: "Upbeat and quick to enjoy things.",
    trading: "Can help you bounce back between sessions; at the extreme, can make risks feel smaller than they are.",
  },
  O1: {
    name: "Imagination",
    about: "How much you use fantasy and imagination.",
    low: "Focused on the concrete and practical.",
    high: "Rich inner world; easily imagines scenarios.",
    trading: "Can help with scenario planning; can also feed stories about a trade that the chart does not support.",
  },
  O2: {
    name: "Artistic Interests",
    about: "How much you appreciate art, beauty and aesthetics.",
    low: "Little interest in art and aesthetics.",
    high: "Moved by beauty, art and design.",
    trading: "Little direct link to trading in this prototype.",
  },
  O3: {
    name: "Emotionality",
    about: "How aware you are of your own feelings.",
    low: "Pays little attention to inner feelings.",
    high: "Notices and values own feelings.",
    trading: "Can make it easier to notice tilt early and name it in a journal.",
  },
  O4: {
    name: "Adventurousness",
    about: "How eager you are to try new activities and change routines.",
    low: "Prefers familiar routines.",
    high: "Seeks variety and new experiences.",
    trading: "Can show up as switching instruments, timeframes or strategies before a fair sample is in.",
  },
  O5: {
    name: "Intellect",
    about: "How much you enjoy ideas, puzzles and abstract thinking.",
    low: "Prefers practical over theoretical.",
    high: "Enjoys complex ideas and analysis.",
    trading: "Can support research and backtesting; can also lead to over-analysis at the moment of execution.",
  },
  O6: {
    name: "Liberalism",
    about: "How readily you question authority, convention and tradition.",
    low: "Values tradition and established rules.",
    high: "Inclined to challenge convention.",
    trading: "Can support contrarian thinking; a low score can make it easier to respect rules you set for yourself.",
  },
  A1: {
    name: "Trust",
    about: "How much you assume others are honest and well-meaning.",
    low: "Sceptical of others’ intentions.",
    high: "Readily trusts others.",
    trading: "A high score can make you take calls from social media or chat rooms on trust.",
  },
  A2: {
    name: "Morality",
    about: "How straightforward and sincere you are in dealing with others.",
    low: "Comfortable bending the truth to get ahead.",
    high: "Candid and straightforward.",
    trading: "Can show up in how honest your journal is with yourself.",
  },
  A3: {
    name: "Altruism",
    about: "How much you enjoy helping others.",
    low: "Focused on own needs.",
    high: "Finds helping others rewarding.",
    trading: "Can make mentoring or review partnerships come naturally.",
  },
  A4: {
    name: "Cooperation",
    about: "How much you avoid confrontation and prefer to go along with others.",
    low: "Ready to confront and compete.",
    high: "Avoids conflict; accommodates others.",
    trading: "A low score can bring a competitive “beat the market” framing into losses.",
  },
  A5: {
    name: "Modesty",
    about: "How much you play down your own achievements.",
    low: "Confident; comfortable talking oneself up.",
    high: "Humble; uneasy with self-promotion.",
    trading: "A low score can feed overconfidence after a winning streak.",
  },
  A6: {
    name: "Sympathy",
    about: "How moved you are by others’ difficulties.",
    low: "Tough-minded about others’ problems.",
    high: "Tender-hearted and compassionate.",
    trading: "Little direct link to trading in this prototype.",
  },
  C1: {
    name: "Self-Efficacy",
    about: "How confident you are that you can get things done.",
    low: "Doubts own ability to succeed.",
    high: "Confident in own competence.",
    trading: "A low score can show up as hesitation, missed valid setups, or moving stops out of fear.",
  },
  C2: {
    name: "Orderliness",
    about: "How much you like order, structure and tidiness.",
    low: "Comfortable with mess and loose structure.",
    high: "Likes things organised and in place.",
    trading: "Can show up in whether your journal, charts and routine are set up and kept up.",
  },
  C3: {
    name: "Dutifulness",
    about: "How strongly you feel bound to keep promises and rules.",
    low: "Treats rules and promises as flexible.",
    high: "Keeps promises and follows rules closely.",
    trading: "Can show up in whether the rules you set for yourself hold when the market tempts you.",
  },
  C4: {
    name: "Achievement-Striving",
    about: "How hard you push toward goals and high standards.",
    low: "Content with a modest level of achievement.",
    high: "Ambitious and driven.",
    trading: "Can fuel practice and study; at the extreme, can turn every red day into a personal failure.",
  },
  C5: {
    name: "Self-Discipline",
    about: "How well you start and finish tasks despite boredom or distraction.",
    low: "Finds it hard to start or stick with dull tasks.",
    high: "Gets on with tasks and sees them through.",
    trading: "A low score can show up as skipping pre-market prep and post-session reviews.",
  },
  C6: {
    name: "Cautiousness",
    about: "How carefully you think before you act.",
    low: "Acts quickly, sometimes without thinking it through.",
    high: "Considers options before acting.",
    trading: "A low score can show up as impulsive entries, oversizing and chasing.",
  },
};

/** Display label for any trait code. */
export function traitName(code: string): string {
  if (code.length === 1) return domains[code as DomainCode]?.name ?? code;
  return facets[code as FacetCode]?.name ?? code;
}
