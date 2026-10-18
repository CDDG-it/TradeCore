/**
 * Scoring cut-offs, on the POMP scale (0–100). Edit freely: every rule,
 * label and colour band reads from here.
 */
export const thresholds = {
  /** At or above this, a trait counts as "high" in the focus-area rules. */
  high: 65,
  /** At or below this, a trait counts as "low". */
  low: 35,
  /**
   * When Depression (N3) or Vulnerability (N6) is at or above this, the results
   * show the calm note that personality tools do not replace support.
   */
  supportNote: 70,
  supportNoteFacets: ["N3", "N6"] as const,
  /** Program weeks at which the target domain is retested. */
  retestWeeks: [6, 12] as const,
  /** Program length in weeks. */
  programWeeks: 12,
  /** Items per assessment page. */
  pageSize: 6,
};
