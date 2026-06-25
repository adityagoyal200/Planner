import type { DayData } from "../types/schedule";
import type { DayKey, WeekSnapshot } from "../store/useScheduleStore";

export interface TimeDebtEntry {
    categoryId: string;
    categoryName: string;
    emoji: string;
    debtMins: number;       // total debt accumulated
    weeksAccumulated: number; // how many weeks this debt has been building
}

/**
 * Compute time debt: categories where blocks were consistently skipped.
 * Looks at completed vs total blocks across week history.
 */
export function computeTimeDebt(
    currentWeek: Record<DayKey, DayData>,
    weekHistory: WeekSnapshot[],
    categories: { id: string; name: string; emoji: string }[]
): TimeDebtEntry[] {
    const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const debtMap: Record<string, { skippedMins: number; weeks: number }> = {};

    // Analyze current week
    for (const dk of dayKeys) {
        for (const block of currentWeek[dk].blocks) {
            if (!block.on) continue;
            if (!block.completed) {
                debtMap[block.type] = debtMap[block.type] || { skippedMins: 0, weeks: 0 };
                debtMap[block.type].skippedMins += block.dur;
            }
        }
    }

    // Analyze past weeks (last 4)
    const recentHistory = weekHistory.slice(-4);
    for (const snapshot of recentHistory) {
        const weekData = snapshot.weekData;
        if (!weekData) continue;
        for (const dk of dayKeys) {
            const day = weekData[dk];
            if (!day) continue;
            for (const block of day.blocks) {
                if (!block.on) continue;
                if (!block.completed) {
                    debtMap[block.type] = debtMap[block.type] || { skippedMins: 0, weeks: 0 };
                    debtMap[block.type].skippedMins += block.dur;
                }
            }
        }
        // Count weeks per category
        for (const catId of Object.keys(debtMap)) {
            debtMap[catId].weeks++;
        }
    }

    // Convert to entries, filter out zero debt
    return Object.entries(debtMap)
        .filter(([, data]) => data.skippedMins > 0)
        .map(([catId, data]) => {
            const cat = categories.find((c) => c.id === catId);
            return {
                categoryId: catId,
                categoryName: cat?.name || catId,
                emoji: cat?.emoji || "📦",
                debtMins: data.skippedMins,
                weeksAccumulated: Math.max(1, data.weeks),
            };
        })
        .sort((a, b) => b.debtMins - a.debtMins);
}

export function formatDebtTime(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
