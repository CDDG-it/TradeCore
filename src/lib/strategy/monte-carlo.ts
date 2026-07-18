/**
 * Monte Carlo simulator for prop-firm evaluations and funded accounts.
 *
 * Given a trader's edge (win rate + reward:risk), their risk per trade and the
 * account's rules (profit target, max drawdown, daily loss limit, deadline), it
 * plays out thousands of randomised trade sequences and reports how often the
 * account *passes* (hits the profit target), *fails* (breaches a drawdown rule)
 * or *times out* (neither, before the deadline).
 *
 * Everything is expressed in account currency so the same engine covers a
 * $50k one-step eval and a $150k funded account without special-casing.
 */

export type DrawdownMode = "trailing" | "static";

export interface MonteCarloInputs {
  /** Starting balance / account size. */
  accountSize: number;
  /** Profit needed to pass, in currency (e.g. 3000 on a $50k eval). */
  profitTarget: number;
  /** Max loss from the drawdown reference before the account fails. */
  maxDrawdown: number;
  /** How the max-drawdown floor behaves. */
  drawdownMode: DrawdownMode;
  /** Intraday loss that hard-fails the day (0 disables it). */
  dailyLossLimit: number;
  /** Amount risked per trade, in currency. */
  riskPerTrade: number;
  /** Probability of a winning trade, 0..1. */
  winRate: number;
  /** Reward-to-risk of the average win (2 = wins are 2× the risk). */
  rewardRisk: number;
  /** Number of trades taken per trading day. */
  tradesPerDay: number;
  /** Deadline in trading days (0 = no deadline). */
  maxDays: number;
  /** How many randomised runs to play out. */
  simulations: number;
  /** How many equity curves to keep for plotting. */
  sampleCurves?: number;
}

export type Outcome = "pass" | "fail" | "timeout";

export interface MonteCarloResult {
  passRate: number; // 0..1
  failRate: number;
  timeoutRate: number;
  /** Median trading days for the runs that passed (null if none passed). */
  medianDaysToPass: number | null;
  /** Per-trade expectancy in R (units of risk). */
  expectancyR: number;
  /** Per-trade expectancy in currency. */
  expectancyMoney: number;
  /** Median ending balance across every run. */
  medianEndBalance: number;
  /** Best / worst ending balance seen. */
  bestEndBalance: number;
  worstEndBalance: number;
  /** A handful of equity curves (balance after each trade) for the chart. */
  curves: { outcome: Outcome; balance: number[] }[];
  /** Distribution of ending balances, bucketed for a histogram. */
  histogram: { label: string; from: number; to: number; count: number }[];
}

/** Mulberry32 — a tiny, fast, seedable PRNG so runs are reproducible. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function runMonteCarlo(input: MonteCarloInputs, seed = 0x9e3779b9): MonteCarloResult {
  const {
    accountSize, profitTarget, maxDrawdown, drawdownMode, dailyLossLimit,
    riskPerTrade, winRate, rewardRisk, tradesPerDay, maxDays, simulations,
  } = input;

  const rng = makeRng(seed);
  const target = accountSize + profitTarget;
  const winAmount = riskPerTrade * rewardRisk;
  const perDay = Math.max(1, Math.floor(tradesPerDay));
  const dayCap = maxDays > 0 ? maxDays : 2000; // hard safety ceiling
  const maxTrades = dayCap * perDay;

  const sampleCount = Math.min(input.sampleCurves ?? 24, simulations);

  let pass = 0, fail = 0, timeout = 0;
  const daysToPass: number[] = [];
  const endBalances: number[] = [];
  const curves: { outcome: Outcome; balance: number[] }[] = [];

  for (let s = 0; s < simulations; s++) {
    let balance = accountSize;
    let peak = accountSize;
    // The static floor is fixed from the start; the trailing floor rises with
    // the peak balance until it locks at (initial + target) on many firms — we
    // keep it simply trailing the peak, which is the stricter, common case.
    const keepCurve = s < sampleCount;
    const curve: number[] = keepCurve ? [balance] : [];

    let outcome: Outcome = "timeout";
    let day = 0;
    let resolved = false;

    for (day = 0; day < dayCap && !resolved; day++) {
      const dayStart = balance;
      for (let i = 0; i < perDay; i++) {
        const win = rng() < winRate;
        balance += win ? winAmount : -riskPerTrade;
        if (balance > peak) peak = balance;
        if (keepCurve) curve.push(balance);

        const floor = drawdownMode === "trailing" ? peak - maxDrawdown : accountSize - maxDrawdown;

        // Failure checks first — a breach on the same trade that hits target
        // still counts as a blow-up (you cannot pass through a violation).
        if (balance <= floor) { outcome = "fail"; resolved = true; break; }
        if (dailyLossLimit > 0 && balance <= dayStart - dailyLossLimit) { outcome = "fail"; resolved = true; break; }
        if (balance >= target) { outcome = "pass"; resolved = true; daysToPass.push(day + 1); break; }
      }
    }

    if (!resolved && maxTrades > 0) outcome = "timeout";

    if (outcome === "pass") pass++;
    else if (outcome === "fail") fail++;
    else timeout++;

    endBalances.push(balance);
    if (keepCurve) curves.push({ outcome, balance: curve });
  }

  endBalances.sort((a, b) => a - b);
  daysToPass.sort((a, b) => a - b);

  // Histogram of ending balances — 12 buckets across the observed range.
  const lo = endBalances[0];
  const hi = endBalances[endBalances.length - 1];
  const buckets = 12;
  const span = Math.max(hi - lo, 1);
  const width = span / buckets;
  const histogram = Array.from({ length: buckets }, (_, b) => {
    const from = lo + b * width;
    const to = b === buckets - 1 ? hi : from + width;
    return { label: `${Math.round(from).toLocaleString()}`, from, to, count: 0 };
  });
  for (const bal of endBalances) {
    let b = Math.floor((bal - lo) / width);
    if (b < 0) b = 0;
    if (b >= buckets) b = buckets - 1;
    histogram[b].count++;
  }

  const expectancyR = winRate * rewardRisk - (1 - winRate);

  return {
    passRate: pass / simulations,
    failRate: fail / simulations,
    timeoutRate: timeout / simulations,
    medianDaysToPass: daysToPass.length ? median(daysToPass) : null,
    expectancyR,
    expectancyMoney: expectancyR * riskPerTrade,
    medianEndBalance: median(endBalances),
    bestEndBalance: hi,
    worstEndBalance: lo,
    curves,
    histogram,
  };
}
