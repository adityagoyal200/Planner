import type { DayData } from "../types/schedule";
import type { DayKey } from "../store/useScheduleStore";
import { computeSchedule } from "./computeSchedule";
import { getDateForDayKey } from "../utils/dateUtils";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
}

export const ALL_BADGES: Badge[] = [
    { id: "early-bird", name: "Early Bird", description: "Wake before 06:00 for 5 days", icon: "🌅", condition: "5 days waking before 6 AM" },
    { id: "week-warrior", name: "Week Warrior", description: "7-day streak", icon: "🔥", condition: "Maintain a 7-day streak" },
    { id: "iron-will", name: "Iron Will", description: "100% score 3 days in a row", icon: "💪", condition: "Perfect day score 3 consecutive days" },
    { id: "sleep-champion", name: "Sleep Champion", description: "Hit sleep target 7 nights", icon: "😴", condition: "Meet sleep target every night this week" },
    { id: "scholar", name: "Scholar", description: "20+ hours study/aim in a week", icon: "📚", condition: "20+ hours of learning blocks" },
    { id: "lightning", name: "Lightning", description: "All morning blocks before work", icon: "⚡", condition: "Complete all pre-work blocks" },
    { id: "centurion", name: "Centurion", description: "100-day streak", icon: "🏆", condition: "Reach a 100-day streak" },
    { id: "balance", name: "Balance", description: "No category > 40% for 5 days", icon: "🧘", condition: "Balanced time distribution" },
];

function getSleepHours(day: DayData, dayKey: DayKey): number {
    const refDate = getDateForDayKey(dayKey);
    const { sleepTime, totalNapMins } = computeSchedule(day, [], { referenceDate: refDate });
    const wakeMins = day.actualWakeTime ?? day.wakeTime;
    const effectiveSleep = day.actualSleepTime ?? sleepTime;

    let sleepDur = 0;
    if (day.actualSleepTime != null && day.actualSleepDate && day.actualWakeDate) {
        const sd = new Date(day.actualSleepDate).getTime() / 60000 + (day.actualSleepTime % 1440);
        const wd = new Date(day.actualWakeDate).getTime() / 60000 + (wakeMins % 1440);
        let diff = wd - sd;
        if (diff < 0) diff += 1440;
        if (diff > 1440) diff -= 1440;
        sleepDur = diff;
    } else if (effectiveSleep <= 1440) {
        sleepDur = (1440 - effectiveSleep) + wakeMins;
    } else {
        sleepDur = wakeMins - (effectiveSleep - 1440);
    }
    sleepDur += totalNapMins;
    return sleepDur / 60;
}

export function checkBadges(
    week: Record<DayKey, DayData>,
    streak: number
): string[] {
    const days: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const earned: string[] = [];

    // Early Bird: 5+ days waking before 6 AM
    const earlyWakes = days.filter(d => {
        const wake = week[d].actualWakeTime ?? week[d].wakeTime;
        return wake < 360; // 6:00 AM
    }).length;
    if (earlyWakes >= 5) earned.push("early-bird");

    // Week Warrior: 7-day streak
    if (streak >= 7) earned.push("week-warrior");

    // Centurion: 100-day streak
    if (streak >= 100) earned.push("centurion");

    // Iron Will: 3 consecutive 100% days
    let consecutivePerfect = 0;
    let maxConsecutive = 0;
    for (const d of days) {
        const total = week[d].blocks.length;
        const on = week[d].blocks.filter(b => b.on).length;
        if (total > 0 && on === total) {
            consecutivePerfect++;
            maxConsecutive = Math.max(maxConsecutive, consecutivePerfect);
        } else {
            consecutivePerfect = 0;
        }
    }
    if (maxConsecutive >= 3) earned.push("iron-will");

    // Sleep Champion: hit target all 7 nights
    const sleepTargetHits = days.filter(d => {
        const hours = getSleepHours(week[d], d);
        return hours * 60 >= week[d].sleepTarget;
    }).length;
    if (sleepTargetHits >= 7) earned.push("sleep-champion");

    // Scholar: 20+ hours of study/aim
    let studyMins = 0;
    for (const d of days) {
        for (const b of week[d].blocks) {
            if (b.on && (b.type === "study" || b.type === "aim")) {
                studyMins += b.dur;
            }
        }
    }
    if (studyMins >= 1200) earned.push("scholar");

    // Lightning: all pre-work blocks completed (at least one workday check)
    const hasLightning = days.some(d => {
        const day = week[d];
        if (day.workStart <= 0) return false;
        const preWorkBlocks = day.blocks.filter(b => b.type !== "work");
        return preWorkBlocks.length > 0 && preWorkBlocks.every(b => b.on);
    });
    if (hasLightning) earned.push("lightning");

    // Balance: no single category > 40% for 5+ days
    let balancedDays = 0;
    for (const d of days) {
        const cats: Record<string, number> = {};
        let totalMins = 0;
        for (const b of week[d].blocks) {
            if (!b.on) continue;
            cats[b.type] = (cats[b.type] || 0) + b.dur;
            totalMins += b.dur;
        }
        if (totalMins === 0) continue;
        const maxPct = Math.max(...Object.values(cats)) / totalMins;
        if (maxPct <= 0.4) balancedDays++;
    }
    if (balancedDays >= 5) earned.push("balance");

    return earned;
}
