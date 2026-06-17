import type { DayData } from "../types/schedule";
import { computeSchedule } from "../engine/computeSchedule";
import { getTotalSleepDurationMins } from "../utils/sleepUtils";

export function computeDaySleepMins(day: DayData, referenceDate: string): number {
    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate });
    return getTotalSleepDurationMins(day, sleepTime, totalNapMins);
}
