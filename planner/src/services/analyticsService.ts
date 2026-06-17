import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { checkBadges } from "../engine/badgeEngine";
import { generateInsights } from "../engine/insightsEngine";
import { computeWeekXP } from "../engine/xpEngine";

export function computeWeeklyXpSummary(
    week: Record<DayKey, DayData>,
    streak: number,
    weekKey: string
): number {
    return computeWeekXP(week, streak, weekKey);
}

export function computeWeeklyInsights(
    week: Record<DayKey, DayData>,
    streak: number,
    weekKey: string
) {
    return generateInsights(week, streak, weekKey);
}

export function computeWeeklyBadges(
    week: Record<DayKey, DayData>,
    streak: number,
    weekKey: string
) {
    return checkBadges(week, streak, weekKey);
}
