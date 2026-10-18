/**
 * IPIP-NEO-60 items (Maples-Keller et al., 2019). Public domain: IPIP grants use
 * "for any purpose, commercial or non-commercial" (ipip.ori.org/newPermission.htm).
 *
 * Transcribed verbatim from https://ipip.ori.org/IPIP-NEO-60ScoringKeys.htm and
 * cross-checked automatically against the IPIP-NEO-300 key (ipip.ori.org/newNEOKey.htm):
 * 60/60 items found there with the same facet and keying. 5 domains x 12 items;
 * each of the 30 NEO facets has 2 items.
 *
 * Ids run 201-260 so they can never be confused with answers saved under the
 * earlier IPIP-NEO-120 version (ids 1-120); see legacy.ts for the carry-over.
 * Administration order interleaves the domains (N1, E1, O1, A1, C1, N2, ...),
 * first item of every facet, then the second.
 *
 * Do not edit item wording. Translations go in a sibling locale folder.
 */
import type { Item } from "@/lib/trade-profile/types";

export const ITEM_SOURCE = "IPIP-NEO-60, Maples-Keller et al. (2019), ipip.ori.org/IPIP-NEO-60ScoringKeys.htm";

export const items: Item[] = [
  { id: 201, text: "Worry about things.", domain: "N", facet: "N1", keyed: "+", source: ITEM_SOURCE },
  { id: 202, text: "Make friends easily.", domain: "E", facet: "E1", keyed: "+", source: ITEM_SOURCE },
  { id: 203, text: "Have a vivid imagination.", domain: "O", facet: "O1", keyed: "+", source: ITEM_SOURCE },
  { id: 204, text: "Trust others.", domain: "A", facet: "A1", keyed: "+", source: ITEM_SOURCE },
  { id: 205, text: "Handle tasks smoothly.", domain: "C", facet: "C1", keyed: "+", source: ITEM_SOURCE },
  { id: 206, text: "Get angry easily.", domain: "N", facet: "N2", keyed: "+", source: ITEM_SOURCE },
  { id: 207, text: "Love large parties.", domain: "E", facet: "E2", keyed: "+", source: ITEM_SOURCE },
  { id: 208, text: "Believe in the importance of art.", domain: "O", facet: "O2", keyed: "+", source: ITEM_SOURCE },
  { id: 209, text: "Cheat to get ahead.", domain: "A", facet: "A2", keyed: "-", source: ITEM_SOURCE },
  { id: 210, text: "Like order.", domain: "C", facet: "C2", keyed: "+", source: ITEM_SOURCE },
  { id: 211, text: "Often feel blue.", domain: "N", facet: "N3", keyed: "+", source: ITEM_SOURCE },
  { id: 212, text: "Take charge.", domain: "E", facet: "E3", keyed: "+", source: ITEM_SOURCE },
  { id: 213, text: "Experience my emotions intensely.", domain: "O", facet: "O3", keyed: "+", source: ITEM_SOURCE },
  { id: 214, text: "Love to help others.", domain: "A", facet: "A3", keyed: "+", source: ITEM_SOURCE },
  { id: 215, text: "Tell the truth.", domain: "C", facet: "C3", keyed: "+", source: ITEM_SOURCE },
  { id: 216, text: "Find it difficult to approach others.", domain: "N", facet: "N4", keyed: "+", source: ITEM_SOURCE },
  { id: 217, text: "Am always busy.", domain: "E", facet: "E4", keyed: "+", source: ITEM_SOURCE },
  { id: 218, text: "Prefer to stick with things that I know.", domain: "O", facet: "O4", keyed: "-", source: ITEM_SOURCE },
  { id: 219, text: "Insult people.", domain: "A", facet: "A4", keyed: "-", source: ITEM_SOURCE },
  { id: 220, text: "Work hard.", domain: "C", facet: "C4", keyed: "+", source: ITEM_SOURCE },
  { id: 221, text: "Rarely overindulge.", domain: "N", facet: "N5", keyed: "-", source: ITEM_SOURCE },
  { id: 222, text: "Love excitement.", domain: "E", facet: "E5", keyed: "+", source: ITEM_SOURCE },
  { id: 223, text: "Avoid philosophical discussions.", domain: "O", facet: "O5", keyed: "-", source: ITEM_SOURCE },
  { id: 224, text: "Believe that I am better than others.", domain: "A", facet: "A5", keyed: "-", source: ITEM_SOURCE },
  { id: 225, text: "Carry out my plans.", domain: "C", facet: "C5", keyed: "+", source: ITEM_SOURCE },
  { id: 226, text: "Remain calm under pressure.", domain: "N", facet: "N6", keyed: "-", source: ITEM_SOURCE },
  { id: 227, text: "Have a lot of fun.", domain: "E", facet: "E6", keyed: "+", source: ITEM_SOURCE },
  { id: 228, text: "Tend to vote for liberal political candidates.", domain: "O", facet: "O6", keyed: "+", source: ITEM_SOURCE },
  { id: 229, text: "Sympathize with the homeless.", domain: "A", facet: "A6", keyed: "+", source: ITEM_SOURCE },
  { id: 230, text: "Make rash decisions.", domain: "C", facet: "C6", keyed: "-", source: ITEM_SOURCE },
  { id: 231, text: "Get stressed out easily.", domain: "N", facet: "N1", keyed: "+", source: ITEM_SOURCE },
  { id: 232, text: "Act comfortably with others.", domain: "E", facet: "E1", keyed: "+", source: ITEM_SOURCE },
  { id: 233, text: "Love to daydream.", domain: "O", facet: "O1", keyed: "+", source: ITEM_SOURCE },
  { id: 234, text: "Believe that others have good intentions.", domain: "A", facet: "A1", keyed: "+", source: ITEM_SOURCE },
  { id: 235, text: "Know how to get things done.", domain: "C", facet: "C1", keyed: "+", source: ITEM_SOURCE },
  { id: 236, text: "Lose my temper.", domain: "N", facet: "N2", keyed: "+", source: ITEM_SOURCE },
  { id: 237, text: "Avoid crowds.", domain: "E", facet: "E2", keyed: "-", source: ITEM_SOURCE },
  { id: 238, text: "Do not like art.", domain: "O", facet: "O2", keyed: "-", source: ITEM_SOURCE },
  { id: 239, text: "Take advantage of others.", domain: "A", facet: "A2", keyed: "-", source: ITEM_SOURCE },
  { id: 240, text: "Leave a mess in my room.", domain: "C", facet: "C2", keyed: "-", source: ITEM_SOURCE },
  { id: 241, text: "Dislike myself.", domain: "N", facet: "N3", keyed: "+", source: ITEM_SOURCE },
  { id: 242, text: "Try to lead others.", domain: "E", facet: "E3", keyed: "+", source: ITEM_SOURCE },
  { id: 243, text: "Am not easily affected by my emotions.", domain: "O", facet: "O3", keyed: "-", source: ITEM_SOURCE },
  { id: 244, text: "Am concerned about others.", domain: "A", facet: "A3", keyed: "+", source: ITEM_SOURCE },
  { id: 245, text: "Break my promises.", domain: "C", facet: "C3", keyed: "-", source: ITEM_SOURCE },
  { id: 246, text: "Am easily intimidated.", domain: "N", facet: "N4", keyed: "+", source: ITEM_SOURCE },
  { id: 247, text: "Am always on the go.", domain: "E", facet: "E4", keyed: "+", source: ITEM_SOURCE },
  { id: 248, text: "Don't like the idea of change.", domain: "O", facet: "O4", keyed: "-", source: ITEM_SOURCE },
  { id: 249, text: "Get back at others.", domain: "A", facet: "A4", keyed: "-", source: ITEM_SOURCE },
  { id: 250, text: "Set high standards for myself and others.", domain: "C", facet: "C4", keyed: "+", source: ITEM_SOURCE },
  { id: 251, text: "Am able to control my cravings.", domain: "N", facet: "N5", keyed: "-", source: ITEM_SOURCE },
  { id: 252, text: "Seek adventure.", domain: "E", facet: "E5", keyed: "+", source: ITEM_SOURCE },
  { id: 253, text: "Am not interested in theoretical discussions.", domain: "O", facet: "O5", keyed: "-", source: ITEM_SOURCE },
  { id: 254, text: "Think highly of myself.", domain: "A", facet: "A5", keyed: "-", source: ITEM_SOURCE },
  { id: 255, text: "Have difficulty starting tasks.", domain: "C", facet: "C5", keyed: "-", source: ITEM_SOURCE },
  { id: 256, text: "Am calm even in tense situations.", domain: "N", facet: "N6", keyed: "-", source: ITEM_SOURCE },
  { id: 257, text: "Love life.", domain: "E", facet: "E6", keyed: "+", source: ITEM_SOURCE },
  { id: 258, text: "Believe in one true religion.", domain: "O", facet: "O6", keyed: "-", source: ITEM_SOURCE },
  { id: 259, text: "Feel sympathy for those who are worse off than myself.", domain: "A", facet: "A6", keyed: "+", source: ITEM_SOURCE },
  { id: 260, text: "Act without thinking.", domain: "C", facet: "C6", keyed: "-", source: ITEM_SOURCE },
];
