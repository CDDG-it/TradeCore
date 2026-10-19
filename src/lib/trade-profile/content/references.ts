/**
 * Reference list. Every exercise and claim in the app links here.
 *
 * Status meanings:
 * - 'verified': bibliographic details (authors, title, journal, year, DOI) were
 *   confirmed against Crossref on 2026-10-18, AND the `claim` below matches the
 *   paper's published abstract. Full texts were not read.
 * - 'to verify': the paper exists (bibliographic details confirmed via Crossref),
 *   but the `claim` has not yet been checked against the paper itself.
 * - 'prototype hypothesis': a design assumption made for this prototype, with no
 *   paper behind it.
 *
 * Never add a DOI, effect size or finding that has not been checked.
 */
export type RefStatus = "verified" | "to verify" | "prototype hypothesis";

export interface Reference {
  id: string;
  citation: string;
  doi?: string;
  status: RefStatus;
  /** What we rely on this source for, in plain words. */
  claim: string;
  /** Note on what was and was not checked. */
  note?: string;
}

export const references: Reference[] = [
  {
    id: "maples2019",
    citation:
      "Maples-Keller, J. L., Williamson, R. L., Sleep, C. E., Carter, N. T., Campbell, W. K., & Miller, J. D. (2019). Using item response theory to develop a 60-item representation of the NEO PI-R using the International Personality Item Pool: Development of the IPIP-NEO-60. Journal of Personality Assessment, 101(1), 4-15.",
    doi: "10.1080/00223891.2017.1381968",
    status: "verified",
    claim: "The source of the 60 items, their facet and domain assignment and their scoring keys used in the assessment.",
    note:
      "Items and keys transcribed from ipip.ori.org/IPIP-NEO-60ScoringKeys.htm, which cites this paper (it prints the pages as 4-5; Crossref gives 4-15). All 60 items were matched verbatim, with the same facet and keying, in the IPIP-NEO-300 key.",
  },
  {
    id: "johnson2014",
    citation:
      "Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. Journal of Research in Personality, 51, 78-89.",
    doi: "10.1016/j.jrp.2014.05.003",
    status: "verified",
    claim: "The 30-facet IPIP structure and facet names the profile follows. The app used this 120-item version before switching to the 60-item one.",
    note: "Citation confirmed via Crossref and the ipip.ori.org item page that cites it.",
  },
  {
    id: "stieger2021",
    citation:
      "Stieger, M., Flückiger, C., Rüegger, D., Kowatsch, T., Roberts, B. W., & Allemand, M. (2021). Changing personality traits with the help of a digital personality change intervention. Proceedings of the National Academy of Sciences, 118(8).",
    doi: "10.1073/pnas.2017548118",
    status: "verified",
    claim:
      "In a randomised controlled trial (n = 1,523), a 3-month smartphone intervention (PEACH) produced self-reported trait changes in the intended direction. Observers also noticed changes, though they were less pronounced, and changes persisted 3 months after the intervention.",
    note: "Claim checked against the PNAS significance statement and the preprint abstract. The list of program components this prototype mirrors (goal setting, implementation intentions, reminders, behavioural activation, self-reflection, journaling, psychoeducation, progress feedback) came from the brief and still needs checking against the full text.",
  },
  {
    id: "hudsonFraley2015",
    citation:
      "Hudson, N. W., & Fraley, R. C. (2015). Volitional personality trait change: Can people choose to change their personality traits? Journal of Personality and Social Psychology, 109(3), 490-507.",
    doi: "10.1037/pspp0000021",
    status: "to verify",
    claim: "People’s goals to change a trait can be followed by change in that direction over time.",
    note: "Bibliographic details confirmed; no abstract was available to check the claim.",
  },
  {
    id: "hudson2019",
    citation:
      "Hudson, N. W., Briley, D. A., Chopik, W. J., & Derringer, J. (2019). You have to follow through: Attaining behavioral change goals predicts volitional personality change. Journal of Personality and Social Psychology, 117(4), 839-857.",
    doi: "10.1037/pspp0000221",
    status: "verified",
    claim:
      "Over 15 weeks, merely accepting weekly behavioural “challenges” did not predict trait change; actually completing them did.",
    note: "Claim checked against the abstract of the preprint (doi 10.31234/osf.io/t36gf).",
  },
  {
    id: "roberts2017",
    citation:
      "Roberts, B. W., Luo, J., Briley, D. A., Chow, P. I., Su, R., & Hill, P. L. (2017). A systematic review of personality trait change through intervention. Psychological Bulletin, 143(2), 117-141.",
    doi: "10.1037/bul0000088",
    status: "to verify",
    claim:
      "Interventions, mostly clinical ones, are followed by changes in personality trait measures, most notably in emotional stability.",
    note: "Bibliographic details confirmed; the claim has not been checked against the paper.",
  },
  {
    id: "gollwitzer2006",
    citation:
      "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69-119.",
    doi: "10.1016/S0065-2601(06)38002-1",
    status: "to verify",
    claim: "Specific if-then plans (“If situation X, then I will do Y”) help people act on their goals.",
    note: "Bibliographic details confirmed; the claim has not been checked against the paper.",
  },
  {
    id: "lally2010",
    citation:
      "Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6), 998-1009.",
    doi: "10.1002/ejsp.674",
    status: "verified",
    claim:
      "Repeating a behaviour daily in the same context increased automaticity along a curve. The time to reach 95% of that plateau ranged from 18 to 254 days. Missing one opportunity did not materially affect habit formation.",
    note: "Claim checked against the abstract. The paper was published online in 2009 and appeared in the 2010 volume.",
  },
  {
    id: "oettingen2012",
    citation: "Oettingen, G. (2012). Future thought and behaviour change. European Review of Social Psychology, 23(1), 1-63.",
    doi: "10.1080/10463283.2011.643698",
    status: "to verify",
    claim:
      "Mental contrasting means imagining a desired outcome and then the obstacle in the way. It can strengthen commitment to feasible goals, and it underlies the WOOP format (Wish, Outcome, Obstacle, Plan).",
    note: "Bibliographic details confirmed; the claim has not been checked against the paper.",
  },
  {
    id: "gross2002",
    citation:
      "Gross, J. J. (2002). Emotion regulation: Affective, cognitive, and social consequences. Psychophysiology, 39(3), 281-291.",
    doi: "10.1017/S0048577201393198",
    status: "verified",
    claim:
      "Reappraisal means changing how you construe a situation. It is often more effective than suppressing the outward signs of an emotion: reappraisal reduces how intensely the emotion is felt, while suppression does not.",
    note: "Claim checked against the abstract.",
  },
  {
    id: "lo2005",
    citation:
      "Lo, A. W., Repin, D. V., & Steenbarger, B. N. (2005). Fear and greed in financial markets: A clinical study of day-traders. NBER Working Paper 11243.",
    doi: "10.3386/w11243",
    status: "verified",
    claim:
      "In 80 day-traders, those whose emotional reactions to gains and losses were more intense performed significantly worse. Personality inventory scores did not reveal a specific “trader personality profile”.",
    note: "Claim checked against the abstract (SSRN version, doi 10.2139/ssrn.690501).",
  },
  {
    id: "kahneman1979",
    citation:
      "Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263-291.",
    doi: "10.2307/1914185",
    status: "to verify",
    claim:
      "People weigh potential losses and gains differently relative to a reference point, with losses weighing more heavily (loss aversion).",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; Crossref has no abstract, so the claim has not been checked against the paper.",
  },
  {
    id: "shefrin1985",
    citation:
      "Shefrin, H., & Statman, M. (1985). The disposition to sell winners too early and ride losers too long: Theory and evidence. The Journal of Finance, 40(3), 777-790.",
    doi: "10.1111/j.1540-6261.1985.tb05002.x",
    status: "verified",
    claim:
      "Aversion to realising losses fits a wider disposition to sell winners too early and hold losers too long, involving mental accounting, regret aversion and self-control.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "odean1998",
    citation:
      "Odean, T. (1998). Are investors reluctant to realize their losses? The Journal of Finance, 53(5), 1775-1798.",
    doi: "10.1111/0022-1082.00072",
    status: "verified",
    claim:
      "In trading records of 10,000 brokerage accounts, investors showed a strong preference for realising winners rather than losers, and this was not justified by later performance.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "barber2000",
    citation:
      "Barber, B. M., & Odean, T. (2000). Trading is hazardous to your wealth: The common stock investment performance of individual investors. The Journal of Finance, 55(2), 773-806.",
    doi: "10.1111/0022-1082.00226",
    status: "verified",
    claim:
      "Among 66,465 households (1991-1996), those that traded most earned 11.4% a year against 17.9% for the market; overconfidence can explain high trading levels.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "grinblatt2009",
    citation:
      "Grinblatt, M., & Keloharju, M. (2009). Sensation seeking, overconfidence, and trading activity. The Journal of Finance, 64(2), 549-578.",
    doi: "10.1111/j.1540-6261.2009.01443.x",
    status: "verified",
    claim:
      "In Finnish population data, overconfident investors and those most prone to sensation seeking traded more frequently, controlling for wealth, income, age and more.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "dorn2009",
    citation:
      "Dorn, D., & Sengmueller, P. (2009). Trading as entertainment? Management Science, 55(4), 591-603.",
    doi: "10.1287/mnsc.1080.0962",
    status: "verified",
    claim:
      "Among 1,000 German brokerage clients, those who reported enjoying investing or gambling turned over their portfolio at twice the rate of their peers.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "lieberman2007",
    citation:
      "Lieberman, M. D., Eisenberger, N. I., Crockett, M. J., Tom, S. M., Pfeifer, J. H., & Way, B. M. (2007). Putting feelings into words. Psychological Science, 18(5), 421-428.",
    doi: "10.1111/j.1467-9280.2007.01916.x",
    status: "verified",
    claim:
      "Putting a feeling into words (affect labeling) reduced the amygdala's response to negative emotional images in an fMRI study.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19). Title as Crossref lists it; the journal prints a subtitle that was not checked.",
  },
  {
    id: "fenton2011",
    citation:
      "Fenton-O'Creevy, M., Soane, E., Nicholson, N., & Willman, P. (2011). Thinking, feeling and deciding: The influence of emotions on the decision making and performance of traders. Journal of Organizational Behavior, 32(8), 1044-1061.",
    doi: "10.1002/job.720",
    status: "verified",
    claim:
      "In a qualitative study of traders at four London investment banks, those using antecedent-focused emotion regulation (acting before the emotion takes hold) had a performance advantage over those relying on response-focused strategies.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "lo2002",
    citation:
      "Lo, A. W., & Repin, D. V. (2002). The psychophysiology of real-time financial risk processing. Journal of Cognitive Neuroscience, 14(3), 323-339.",
    doi: "10.1162/089892902317361877",
    status: "verified",
    claim:
      "Professional traders measured during live sessions showed significant physiological responses (skin conductance, cardiovascular changes) to market events and periods of high volatility.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "coates2008",
    citation:
      "Coates, J. M., & Herbert, J. (2008). Endogenous steroids and financial risk taking on a London trading floor. Proceedings of the National Academy of Sciences, 105(16), 6167-6172.",
    doi: "10.1073/pnas.0704025105",
    status: "verified",
    claim:
      "On a London trading floor, traders' cortisol rose with both the variance of their trading results and market volatility.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "killgore2006",
    citation:
      "Killgore, W. D. S., Balkin, T. J., & Wesensten, N. J. (2006). Impaired decision making following 49 h of sleep deprivation. Journal of Sleep Research, 15(1), 7-13.",
    doi: "10.1111/j.1365-2869.2006.00487.x",
    status: "verified",
    claim:
      "After about 49 hours without sleep, healthy volunteers made riskier, worse choices on the Iowa Gambling Task than when rested.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "dai2014",
    citation:
      "Dai, H., Milkman, K. L., & Riis, J. (2014). The fresh start effect: Temporal landmarks motivate aspirational behavior. Management Science, 60(10), 2563-2582.",
    doi: "10.1287/mnsc.2014.1901",
    status: "verified",
    claim:
      "Goal-directed behaviour (gym visits, goal commitments, diet searches) increased after temporal landmarks such as the start of a new week, month or year.",
    note: "Claim checked against the abstract (Crossref, 2026-10-19).",
  },
  {
    id: "zaccaro2018",
    citation:
      "Zaccaro, A., Piarulli, A., Laurino, M., Garbella, E., Menicucci, D., Neri, B., & Gemignani, A. (2018). How breath-control can change your life: A systematic review on psycho-physiological correlates of slow breathing. Frontiers in Human Neuroscience, 12, 353.",
    doi: "10.3389/fnhum.2018.00353",
    status: "to verify",
    claim:
      "A systematic review of slow-breathing studies reporting links with calmer physiological and psychological states.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "bandura1977",
    citation:
      "Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. Psychological Review, 84(2), 191-215.",
    doi: "10.1037/0033-295X.84.2.191",
    status: "to verify",
    claim:
      "Self-efficacy, the belief that you can carry out a behaviour, is built most strongly by your own experiences of doing it.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "bowen2009",
    citation:
      "Bowen, S., & Marlatt, A. (2009). Surfing the urge: Brief mindfulness-based intervention for college student smokers. Psychology of Addictive Behaviors, 23(4), 666-671.",
    doi: "10.1037/a0017127",
    status: "to verify",
    claim:
      "Urge surfing means noticing a craving and watching it rise and fall without acting on it; a brief version was tested with smokers.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "brooks2014",
    citation:
      "Brooks, A. W. (2014). Get excited: Reappraising pre-performance anxiety as excitement. Journal of Experimental Psychology: General, 143(3), 1144-1158.",
    doi: "10.1037/a0035325",
    status: "to verify",
    claim:
      "Reframing pre-performance anxiety as excitement, rather than trying to calm down, can improve performance under pressure.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "kross2014",
    citation:
      "Kross, E., Bruehlman-Senecal, E., Park, J., Burson, A., Dougherty, A., Shablack, H., Bremner, R., Moser, J., & Ayduk, O. (2014). Self-talk as a regulatory mechanism: How you do it matters. Journal of Personality and Social Psychology, 106(2), 304-324.",
    doi: "10.1037/a0035173",
    status: "to verify",
    claim:
      "Talking to yourself in the second or third person (using your own name) creates distance and can help regulate thoughts and feelings under stress.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "balban2023",
    citation:
      "Balban, M. Y., Neri, E., Kogon, M. M., Weed, L., Nouriani, B., Jo, B., Holl, G., Zeitzer, J. M., Spiegel, D., & Huberman, A. D. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine, 4(1), 100895.",
    doi: "10.1016/j.xcrm.2022.100895",
    status: "to verify",
    claim:
      "A few minutes a day of structured breathing, including cyclic sighing (a double inhale and a long exhale), was compared with mindfulness meditation for effects on mood and arousal.",
    note: "Bibliographic details confirmed via Crossref on 2026-10-19; the claim has not been checked against the paper.",
  },
  {
    id: "proto-friction",
    citation: "TradingMC prototype: friction before an unplanned trade",
    status: "prototype hypothesis",
    claim:
      "Adding a small, deliberate step between the urge and the click (a delay, writing the risk down) makes impulsive entries less likely. A design assumption, not a finding.",
  },
  {
    id: "proto-sample-size",
    citation: "TradingMC prototype: judging a setup on enough trades",
    status: "prototype hypothesis",
    claim:
      "A setup cannot be judged on a handful of trades; committing to a fixed number before changing it protects against switching after normal losing streaks. A design assumption, not a finding.",
  },
  {
    id: "proto-trading-links",
    citation: "TradingMC prototype: links between facets and trading behaviour",
    status: "prototype hypothesis",
    claim:
      "The “for trading” lines and the focus-area rules link facet patterns to common trading problems. They are design assumptions to test, not research findings.",
  },
  {
    id: "proto-graded-exposure",
    citation: "TradingMC prototype: exposure in small steps",
    status: "prototype hypothesis",
    claim:
      "Facing an uncomfortable trading situation in small, planned steps (for example simulator first, then minimum size) makes it easier to act in line with the plan. No source has been attached yet.",
  },
  {
    id: "proto-habit-stacking",
    citation: "TradingMC prototype: habit stacking",
    status: "prototype hypothesis",
    claim:
      "Attaching a new behaviour to an existing fixed routine (“after I open the platform, I ...”) supplies the consistent context described by Lally et al. (2010). “Habit stacking” is a popular term, not a term from that paper.",
  },
];

export const referenceById = Object.fromEntries(references.map((r) => [r.id, r])) as Record<string, Reference>;
