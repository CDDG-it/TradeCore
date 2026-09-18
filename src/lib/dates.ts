/**
 * Calendar-day keys, always in the trader's local time.
 *
 * Every day-keyed row in the app (habit ticks, trades, best trade, reviews) is
 * written as "yyyy-MM-dd" from the browser's clock. Reading the same rows back
 * has to use the same clock: `toISOString()` is UTC, and in the evening it is
 * already tomorrow for anyone east of Greenwich.
 */
import { format, startOfMonth, subDays } from "date-fns";

export { subDays };

/** "yyyy-MM-dd" for a date, in local time. */
export const localDayKey = (d: Date): string => format(d, "yyyy-MM-dd");

/** Today's key, in local time. Call it, never cache it: tabs outlive midnight. */
export const todayKey = (): string => localDayKey(new Date());

/** The first day of the month `d` is in, as a key. */
export const monthStartKey = (d: Date = new Date()): string => localDayKey(startOfMonth(d));
