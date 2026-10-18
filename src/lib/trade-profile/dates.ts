/** Calendar-day keys ("yyyy-MM-dd", local time), matching src/lib/dates.ts. */
import { addDays as addDaysFns, differenceInCalendarDays, format, parseISO } from "date-fns";

export type DateKey = string;

export const toKey = (d: Date): DateKey => format(d, "yyyy-MM-dd");
export const fromKey = (k: DateKey): Date => parseISO(k);
export const addDays = (k: DateKey, n: number): DateKey => toKey(addDaysFns(parseISO(k), n));
/** Whole calendar days from a to b (b − a). */
export const daysBetween = (a: DateKey, b: DateKey): number => differenceInCalendarDays(parseISO(b), parseISO(a));
/** Today, shifted by a demo day offset. */
export const today = (dayOffset = 0): DateKey => addDays(toKey(new Date()), dayOffset);
