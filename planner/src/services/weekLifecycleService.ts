import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { computeSchedule } from "../engine/computeSchedule";
import { getTotalSleepDurationMins } from "../utils/sleepUtils";

export interface WeekAggregate {
    totalSleepMins: number;
    totalDayScore: number;
    completedBlocks: number;
    totalBlocks: number;
    categoryBreakdown: Record<string, number>;
}

export function computeWeekAggregate(week: Record<DayKey, DayData>): WeekAggregate {
    let totalSleepMins = 0;
    let totalDayScore = 0;
    let completedBlocks = 0;
    let totalBlocks = 0;
    const categoryBreakdown: Record<string, number> = {};
    const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    for (const key of dayKeys) {
        const dayData = week[key];
        const { sleepTime, totalNapMins, dayScore } = computeSchedule(dayData);
        totalDayScore += dayScore;
        totalSleepMins += getTotalSleepDurationMins(dayData, sleepTime, totalNapMins);
        for (const block of dayData.blocks) {
            if (!block.on) continue;
            totalBlocks++;
            if (block.completed) completedBlocks++;
            categoryBreakdown[block.type] = (categoryBreakdown[block.type] || 0) + block.dur;
        }
    }

    return { totalSleepMins, totalDayScore, completedBlocks, totalBlocks, categoryBreakdown };
}
