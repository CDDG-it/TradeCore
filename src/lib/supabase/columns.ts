/**
 * Ties a column list to the row type it produces.
 *
 * Why this exists: a read that asks for `*` hands the browser every column,
 * including the long prose and the screenshot arrays that no list ever shows.
 * Narrowing the read fixes that, but a narrowed `select` and a cast to the full
 * domain type is worse than no narrowing at all, because the type then claims
 * fields the row does not have and nothing checks the claim. That is how
 * `dashboard/reads.ts` was written, and it is how a dropped column becomes a
 * `TypeError` at render time rather than a compile error.
 *
 * Here the column list is the single source of truth. `select` is the string
 * PostgREST receives; `row` is a phantom value, never defined at runtime, whose
 * type is the exact `Pick<>` those columns yield. Take a name out of the list
 * and every consumer still reading that field stops compiling.
 *
 * Usage:
 *
 *   const ANALYSIS_LIST = columns<PreTradeAnalysis>()("id", "date", "title");
 *   export type AnalysisListRow = typeof ANALYSIS_LIST.row;
 *
 *   supabase.from("analyses").select(ANALYSIS_LIST.select)
 *
 * The two-step call is what lets the entity type be given explicitly while the
 * key tuple is still inferred: TypeScript has no partial inference within one
 * call, so a single `columns<PreTradeAnalysis>("id", "date")` would widen the
 * keys to `string[]` and lose the whole point.
 */
export function columns<T>() {
  return <const K extends readonly (keyof T & string)[]>(...keys: K) => ({
    select: keys.join(","),
    row: undefined as unknown as Pick<T, K[number]>,
  });
}
