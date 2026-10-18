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
