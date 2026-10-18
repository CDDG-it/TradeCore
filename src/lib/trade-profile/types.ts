export const DOMAINS = ["N", "E", "O", "A", "C"] as const;
export type DomainCode = (typeof DOMAINS)[number];
export type FacetCode = `${DomainCode}${1 | 2 | 3 | 4 | 5 | 6}`;
/** A domain ("N") or a facet ("N1"). */
export type TraitCode = DomainCode | FacetCode;

export const FACETS: FacetCode[] = DOMAINS.flatMap((d) => ([1, 2, 3, 4, 5, 6] as const).map((n) => `${d}${n}` as FacetCode));

export type Answer = 1 | 2 | 3 | 4 | 5;
/** Item id → answer on the 1–5 scale, as the trader gave it (before reverse keying). */
export type Answers = Record<number, Answer>;

export interface Item {
  id: number;
  text: string;
  domain: DomainCode;
  facet: FacetCode;
  keyed: "+" | "-";
  source: string;
}

/** POMP scores (0–100), position on the scale. A trait is absent when it could not be scored. */
export interface Profile {
  domains: Partial<Record<DomainCode, number>>;
  facets: Partial<Record<FacetCode, number>>;
}

export type Direction = "increase" | "decrease" | "channel";

export interface GoalTarget {
  trait: TraitCode;
  direction: Direction;
}

export const isDomain = (t: TraitCode): t is DomainCode => t.length === 1;
export const domainOf = (t: TraitCode): DomainCode => t[0] as DomainCode;

export type Technique =
  | "implementationIntention"
  | "behaviouralActivation"
  | "selfMonitoring"
  | "cognitiveReappraisal"
  | "mentalContrasting"
  | "reflection"
  | "habitStacking"
  | "gradedExposure";

export type Difficulty = 1 | 2 | 3;

export interface Exercise {
  id: string;
  title: string;
  /** One line: what the exercise is for. */
  goal: string;
  /** `trait: null` marks a general exercise usable with any goal. */
  target: { trait: TraitCode | null; direction: Direction | null };
  focusArea: string;
  technique: Technique;
  difficulty: Difficulty;
  frequency: string;
  duration: string;
  instructions: string;
  tradingVersion: string;
  /** How the trader logs completion. */
  logging: string;
  referenceIds: string[];
}

export type CheckinDone = "yes" | "partly" | "no";
export interface Checkin {
  exerciseId: string;
  done: CheckinDone;
  /** How hard it was, 1–5. */
  difficulty: number;
  /** One-item state rating of the target trait today, 1–7. */
  state: number;
}
