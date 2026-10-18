import type { Answer, Answers, DomainCode, FacetCode, Item, Profile, TraitCode } from "@/lib/trade-profile/types";
import { isDomain } from "@/lib/trade-profile/types";

/** Reverse keying: a "–" keyed item scores 6 minus the answer. */
export function keyedScore(item: Item, answer: Answer): number {
  return item.keyed === "-" ? 6 - answer : answer;
}

/** Percent of maximum possible on a 1–5 scale: 1 → 0, 3 → 50, 5 → 100. */
export function toPomp(mean: number): number {
  return ((mean - 1) / 4) * 100;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Mean keyed score of a set of items, or undefined unless every item is answered. */
function meanIfComplete(group: Item[], answers: Answers): number | undefined {
  if (group.length === 0) return undefined;
  const scores: number[] = [];
  for (const item of group) {
    const a = answers[item.id];
    if (a === undefined) return undefined;
    scores.push(keyedScore(item, a));
  }
  return mean(scores);
}

/**
 * Facet score = mean of its items; domain score = mean of all its items.
 * Only fully answered facets and domains are scored, so a partial retest
 * (one domain's 24 items) yields that domain and its six facets only.
 */
export function scoreProfile(items: Item[], answers: Answers): Profile {
  const profile: Profile = { domains: {}, facets: {} };
  const byFacet = new Map<FacetCode, Item[]>();
  const byDomain = new Map<DomainCode, Item[]>();
  for (const item of items) {
    byFacet.set(item.facet, [...(byFacet.get(item.facet) ?? []), item]);
    byDomain.set(item.domain, [...(byDomain.get(item.domain) ?? []), item]);
  }
  for (const [facet, group] of byFacet) {
    const m = meanIfComplete(group, answers);
    if (m !== undefined) profile.facets[facet] = toPomp(m);
  }
  for (const [domain, group] of byDomain) {
    const m = meanIfComplete(group, answers);
    if (m !== undefined) profile.domains[domain] = toPomp(m);
  }
  return profile;
}

export function traitScore(profile: Profile, trait: TraitCode): number | undefined {
  return isDomain(trait) ? profile.domains[trait] : profile.facets[trait];
}

export function answeredCount(items: Item[], answers: Answers): number {
  return items.filter((i) => answers[i.id] !== undefined).length;
}

export const isComplete = (items: Item[], answers: Answers) => answeredCount(items, answers) === items.length;
