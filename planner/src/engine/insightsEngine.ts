import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { computeSchedule } from "./computeSchedule";
import { getDateForDayKeyInWeek } from "../utils/dateUtils";
import { getTotalSleepDurationMins } from "../utils/sleepUtils";

export interface Insight {
    text: string;
    type: "positive" | "neutral" | "warning";
}

function getSleepHoursForDay(day: DayData, dayKey: DayKey, weekKey: string): number {
    const refDate = getDateForDayKeyInWeek(dayKey, weekKey);
    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });
    return getTotalSleepDurationMins(day, sleepTime, totalNapMins) / 60;
}

export function generateInsights(
    week: Record<DayKey, DayData>,
    streak: number,
    weekKey: string
): Insight[] {
    const days: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const dayLabels: Record<DayKey, string> = {
        mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
        fri: "Friday", sat: "Saturday", sun: "Sunday"
    };
    const insights: Insight[] = [];

    // === Sleep Insights ===
    const sleepHours = days.map(d => getSleepHoursForDay(week[d], d, weekKey));
    const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / 7;
    const avgTarget = days.reduce((a, d) => a + week[d].sleepTarget, 0) / 7 / 60;

    if (avgSleep < avgTarget) {
        const deficit = (avgTarget - avgSleep).toFixed(1);
        insights.push({
            text: `You average ${avgSleep.toFixed(1)}h of sleep — ${deficit}h below your ${avgTarget.toFixed(0)}h target.`,
            type: "warning"
        });
    } else {
        insights.push({
            text: `Great sleep! You average ${avgSleep.toFixed(1)}h — meeting your ${avgTarget.toFixed(0)}h target.`,
            type: "positive"
        });
    }

    // Best & worst sleep days
    const bestSleepIdx = sleepHours.indexOf(Math.max(...sleepHours));
    const worstSleepIdx = sleepHours.indexOf(Math.min(...sleepHours));
    if (sleepHours[bestSleepIdx] - sleepHours[worstSleepIdx] > 1.5) {
        insights.push({
            text: `You sleep best on ${dayLabels[days[bestSleepIdx]]} (${sleepHours[bestSleepIdx].toFixed(1)}h) and worst on ${dayLabels[days[worstSleepIdx]]} (${sleepHours[worstSleepIdx].toFixed(1)}h).`,
            type: "neutral"
        });
    }

    // === Productivity Insights ===
    const dayScores = days.map(d => {
        const total = week[d].blocks.length;
        const on = week[d].blocks.filter(b => b.on).length;
        return total > 0 ? (on / total) * 100 : 100;
    });
    const bestDayIdx = dayScores.indexOf(Math.max(...dayScores));
    if (dayScores[bestDayIdx] > 70) {
        insights.push({
            text: `${dayLabels[days[bestDayIdx]]} is your most productive day (${Math.round(dayScores[bestDayIdx])}% completion).`,
            type: "positive"
        });
    }

    // === Category Distribution ===
    const catTotals: Record<string, number> = {};
    let totalMins = 0;
    for (const d of days) {
        for (const b of week[d].blocks) {
            if (!b.on) continue;
            catTotals[b.type] = (catTotals[b.type] || 0) + b.dur;
            totalMins += b.dur;
        }
    }

    if (totalMins > 0) {
        const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
        if (topCat) {
            const pct = Math.round((topCat[1] / totalMins) * 100);
            const hours = (topCat[1] / 60).toFixed(1);
            insights.push({
                text: `${pct}% of your week (${hours}h) goes to "${topCat[0]}" blocks.`,
                type: "neutral"
            });
        }
    }

    // Deep work hours
    const deepWorkMins = (catTotals["work"] || 0) + (catTotals["study"] || 0);
    if (deepWorkMins > 0) {
        const dwHours = (deepWorkMins / 60).toFixed(1);
        insights.push({
            text: `You have ${dwHours}h of deep work planned this week.`,
            type: deepWorkMins >= 20 * 60 ? "positive" : "neutral"
        });
    }

    // === Streak ===
    if (streak >= 7) {
        insights.push({
            text: `🔥 ${streak}-day streak! Keep the momentum going.`,
            type: "positive"
        });
    } else if (streak === 0) {
        insights.push({
            text: `Start a streak by completing your blocks today!`,
            type: "neutral"
        });
    }

    return insights.slice(0, 5); // Cap at 5 insights
}
