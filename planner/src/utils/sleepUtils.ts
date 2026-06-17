import type { DayData } from "../types/schedule";
import { getDaysDiff } from "./dateUtils";

const MINS_PER_DAY = 24 * 60;
const MAX_REASONABLE_NIGHT_SLEEP_MINS = 16 * 60;

function minuteOfDay(mins: number): number {
    return ((mins % MINS_PER_DAY) + MINS_PER_DAY) % MINS_PER_DAY;
}

function normalizeNightDuration(diffMins: number): number {
    let diff = diffMins;
    while (diff < 0) diff += MINS_PER_DAY;
    while (diff > MINS_PER_DAY) diff -= MINS_PER_DAY;
    return diff;
}

function inferNightSleepDurationMins(wakeMins: number, sleepMins: number): number {
    let diff = minuteOfDay(wakeMins) - minuteOfDay(sleepMins);
    if (diff <= 0) diff += MINS_PER_DAY;
    return diff;
}

export function getNightSleepDurationMins(day: DayData, plannedSleepTime: number): number {
    const wakeMins = day.actualWakeTime ?? day.wakeTime;

    if (day.actualSleepTime != null && day.actualSleepDate && day.actualWakeDate) {
        const dateDiff = getDaysDiff(day.actualWakeDate, day.actualSleepDate);
        const diff = dateDiff * MINS_PER_DAY + minuteOfDay(wakeMins) - minuteOfDay(day.actualSleepTime);
        const normalized = normalizeNightDuration(diff);
        if (normalized > 0 && normalized <= MAX_REASONABLE_NIGHT_SLEEP_MINS) {
            return normalized;
        }
        // If logged dates are inconsistent, fall back to time-based inference.
        return inferNightSleepDurationMins(wakeMins, day.actualSleepTime);
    }

    if (day.actualSleepTime != null) {
        return inferNightSleepDurationMins(wakeMins, day.actualSleepTime);
    }

    if (plannedSleepTime <= MINS_PER_DAY) {
        return (MINS_PER_DAY - plannedSleepTime) + wakeMins;
    }

    return wakeMins - (plannedSleepTime - MINS_PER_DAY);
}

export function getTotalSleepDurationMins(
    day: DayData,
    plannedSleepTime: number,
    totalNapMins: number
): number {
    return Math.max(0, getNightSleepDurationMins(day, plannedSleepTime) + totalNapMins);
}
