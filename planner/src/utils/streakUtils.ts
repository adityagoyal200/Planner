import { addDaysToISODate, toLocalISODate } from "./dateUtils";

/** Last activity date for streak, skipping frozen days. */
export function effectiveLastStreakDate(
    lastCompletedDate: string | null,
    frozenDates: string[]
): string | null {
    if (!lastCompletedDate) return null;
    let cursor = lastCompletedDate;
    const frozen = new Set(frozenDates);
    while (cursor && frozen.has(cursor)) {
        cursor = addDaysToISODate(cursor, -1);
    }
    return cursor;
}

export function isStreakConsecutive(
    lastCompletedDate: string | null,
    frozenDates: string[],
    today: string = toLocalISODate()
): boolean {
    const effective = effectiveLastStreakDate(lastCompletedDate, frozenDates);
    if (!effective) return false;
    const yesterday = addDaysToISODate(today, -1);
    return effective === yesterday || effective === today;
}

export function isStreakAtRisk(
    streak: number,
    lastCompletedDate: string | null,
    frozenDates: string[],
    today: string = toLocalISODate()
): boolean {
    if (streak <= 0) return false;
    if (lastCompletedDate === today) return false;
    if (frozenDates.includes(today)) return false;
    return true;
}
